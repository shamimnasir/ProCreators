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
    
    console.log('runLLM called, EMERGENT_LLM_KEY present:', !!process.env.EMERGENT_LLM_KEY)
    
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
async function generateWordSearch(theme, difficulty, ageGroup) {
  const sizes = { easy: 8, medium: 12, hard: 15 }
  const gridSize = sizes[difficulty] || 10
  
  // Use themed content
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const words = [...themedContent.wordSearchWords].slice(0, difficulty === 'easy' ? 6 : difficulty === 'hard' ? 10 : 8)
  
  // Generate grid with actual word placement
  const grid = Array(gridSize).fill(null).map(() => 
    Array(gridSize).fill(null).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
  )
  
  // Place words in the grid (horizontal and vertical)
  words.forEach((word, idx) => {
    const isHorizontal = idx % 2 === 0
    const maxStart = gridSize - word.length
    
    if (maxStart >= 0) {
      const startRow = Math.floor(Math.random() * (isHorizontal ? gridSize : maxStart + 1))
      const startCol = Math.floor(Math.random() * (isHorizontal ? maxStart + 1 : gridSize))
      
      for (let i = 0; i < word.length; i++) {
        if (isHorizontal) {
          grid[startRow][startCol + i] = word[i]
        } else {
          grid[startRow + i][startCol] = word[i]
        }
      }
    }
  })
  
  return {
    type: 'word-search',
    grid,
    words,
    gridSize,
    theme,
    instructions: `Find and circle these ${words.length} ${theme || ''} words in the grid!`
  }
}

function generateCrossword(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific crossword clues
  const themedClues = {
    sports: {
      across: [
        { number: 1, clue: 'You kick this ball into a net', answer: 'SOCCER', row: 0, col: 0 },
        { number: 3, clue: 'Person who leads the team', answer: 'COACH', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'You try to make this in basketball', answer: 'SCORE', row: 0, col: 0 },
        { number: 2, clue: 'What you want to do - not lose', answer: 'WIN', row: 0, col: 3 }
      ]
    },
    animals: {
      across: [
        { number: 1, clue: 'King of the jungle', answer: 'LION', row: 0, col: 0 },
        { number: 3, clue: 'Man\'s best friend', answer: 'DOG', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'Has spots and a long neck', answer: 'GIRAFFE', row: 0, col: 0 },
        { number: 2, clue: 'Swims in water', answer: 'FISH', row: 0, col: 3 }
      ]
    },
    ocean: {
      across: [
        { number: 1, clue: 'Biggest animal in the ocean', answer: 'WHALE', row: 0, col: 0 },
        { number: 3, clue: 'Has eight arms', answer: 'OCTOPUS', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'Has fins and sharp teeth', answer: 'SHARK', row: 0, col: 0 },
        { number: 2, clue: 'Walks sideways', answer: 'CRAB', row: 0, col: 3 }
      ]
    },
    space: {
      across: [
        { number: 1, clue: 'Takes astronauts to space', answer: 'ROCKET', row: 0, col: 0 },
        { number: 3, clue: 'Bright objects in night sky', answer: 'STARS', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'The red planet', answer: 'MARS', row: 0, col: 0 },
        { number: 2, clue: 'Orbits Earth at night', answer: 'MOON', row: 0, col: 3 }
      ]
    },
    food: {
      across: [
        { number: 1, clue: 'Round with cheese and toppings', answer: 'PIZZA', row: 0, col: 0 },
        { number: 3, clue: 'Sweet treat after dinner', answer: 'CAKE', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'Red fruit that keeps doctors away', answer: 'APPLE', row: 0, col: 0 },
        { number: 2, clue: 'Yellow and curved', answer: 'BANANA', row: 0, col: 3 }
      ]
    },
    default: {
      across: [
        { number: 1, clue: 'A large animal with a mane', answer: 'LION', row: 0, col: 0 },
        { number: 3, clue: 'Man\'s best friend', answer: 'DOG', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'Has spots and a long neck', answer: 'GIRAFFE', row: 0, col: 0 },
        { number: 2, clue: 'Lives in the ocean', answer: 'FISH', row: 0, col: 3 }
      ]
    }
  }
  
  // Find matching theme clues
  let clues = themedClues.default
  for (const [key, value] of Object.entries(themedClues)) {
    if (theme?.toLowerCase().includes(key)) {
      clues = value
      break
    }
  }
  
  return {
    type: 'crossword',
    clues,
    gridSize: difficulty === 'easy' ? 8 : difficulty === 'hard' ? 15 : 12,
    theme,
    instructions: `Fill in the ${theme || ''} crossword puzzle using the clues below!`
  }
}

async function generateSudoku(theme, difficulty, ageGroup) {
  // For kids, use smaller grids with themed items instead of numbers
  const isKids = ['toddler', 'preschool', 'early'].includes(ageGroup)
  const size = isKids ? 4 : (difficulty === 'easy' ? 6 : 9)
  
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme && isKids) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  // Theme-specific symbols for kids sudoku
  const themedSymbols = {
    sports: ['Ball', 'Goal', 'Star', 'Cup'],
    food: ['Apple', 'Cake', 'Pizza', 'Cookie'],
    animals: ['Cat', 'Dog', 'Bird', 'Fish'],
    ocean: ['Fish', 'Crab', 'Star', 'Shell'],
    space: ['Star', 'Moon', 'Sun', 'Rocket'],
    dinosaurs: ['Dino', 'Egg', 'Bone', 'Leaf'],
    vehicles: ['Car', 'Bus', 'Boat', 'Plane'],
    nature: ['Flower', 'Tree', 'Sun', 'Cloud']
  }
  
  // For custom themes, use AI-generated memory items as symbols
  let symbols = null
  if (isKids) {
    if (themedContent.isAIGenerated && themedContent.memoryItems) {
      symbols = themedContent.memoryItems.slice(0, 4)
    } else {
      symbols = themedSymbols[theme?.toLowerCase()] || ['A', 'B', 'C', 'D']
    }
  }
  
  // Generate a valid sudoku grid (simplified)
  const grid = Array(size).fill(null).map(() => Array(size).fill(0))
  
  return {
    type: 'sudoku',
    grid,
    size,
    symbols,
    theme,
    instructions: isKids 
      ? `Fill in each row and column with different ${theme || ''} items: ${symbols?.join(', ')}!`
      : `Fill in the grid so each row, column, and box contains the numbers 1-${size}.`
  }
}

async function generateMaze(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const mazeTheme = themedContent.mazeTheme || { start: 'START', end: 'FINISH', instruction: `Find your way through the ${theme} maze!` }
  
  const sizes = { easy: 8, medium: 15, hard: 25 }
  const size = sizes[difficulty] || 12
  
  return {
    type: 'maze',
    size,
    start: { x: 0, y: 0 },
    end: { x: size - 1, y: size - 1 },
    startLabel: mazeTheme.start,
    endLabel: mazeTheme.end,
    theme,
    seed: Date.now() + Math.random(),
    instructions: mazeTheme.instruction
  }
}

function generateSpotDifference(theme, difficulty, ageGroup) {
  const differences = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 8
  
  // Theme-specific scene descriptions
  const themeScenes = {
    sports: 'stadium scene',
    food: 'kitchen scene',
    animals: 'zoo scene',
    ocean: 'underwater scene',
    space: 'space scene',
    dinosaurs: 'prehistoric scene',
    vehicles: 'parking lot scene',
    nature: 'forest scene'
  }
  
  return {
    type: 'spot-difference',
    differences,
    scene: themeScenes[theme?.toLowerCase()] || 'picture',
    theme,
    instructions: `Can you spot all ${differences} differences between these two ${themeScenes[theme?.toLowerCase()] || 'picture'}s?`
  }
}

function generateConnectDots(theme, difficulty, ageGroup) {
  const dots = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 100 : 50
  
  // Theme-specific reveal hints
  const themeReveals = {
    sports: ['a soccer ball', 'a trophy', 'a basketball', 'a tennis racket'],
    food: ['a cupcake', 'a pizza slice', 'an apple', 'an ice cream cone'],
    animals: ['a friendly dog', 'a cute cat', 'a wise owl', 'a happy dolphin'],
    ocean: ['a starfish', 'a whale', 'a seahorse', 'an octopus'],
    space: ['a rocket ship', 'a planet', 'a star', 'an alien spaceship'],
    dinosaurs: ['a T-Rex', 'a dinosaur egg', 'a Triceratops', 'a Pterodactyl'],
    vehicles: ['a race car', 'an airplane', 'a rocket', 'a sailboat'],
    nature: ['a butterfly', 'a flower', 'a rainbow', 'a tree']
  }
  
  const reveals = themeReveals[theme?.toLowerCase()] || ['a surprise picture']
  const reveal = reveals[Math.floor(Math.random() * reveals.length)]
  
  return {
    type: 'connect-dots',
    dots,
    reveal,
    theme,
    instructions: `Connect the dots from 1 to ${dots} to reveal ${reveal}!`
  }
}

function generateMathProblems(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
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
  
  // Theme-specific word problems context
  const wordProblemContexts = {
    sports: ['goals scored', 'points earned', 'players on team', 'laps run', 'medals won'],
    food: ['apples picked', 'cookies baked', 'pizzas ordered', 'cupcakes made', 'oranges bought'],
    animals: ['cats in shelter', 'dogs at park', 'fish in tank', 'birds in tree', 'rabbits in garden'],
    ocean: ['fish caught', 'shells collected', 'dolphins spotted', 'waves counted', 'crabs on beach'],
    space: ['stars counted', 'planets visited', 'rockets launched', 'asteroids seen', 'moons orbited'],
    dinosaurs: ['fossils found', 'bones discovered', 'footprints counted', 'eggs in nest', 'dinosaurs spotted'],
    vehicles: ['cars in lot', 'buses on road', 'planes at airport', 'trains passed', 'bikes parked'],
    nature: ['flowers planted', 'trees in forest', 'butterflies seen', 'leaves collected', 'birds spotted']
  }
  
  const contexts = wordProblemContexts[theme?.toLowerCase()] || wordProblemContexts.sports || ['items counted']
  
  const problems = []
  const ops = operations[ageGroup] || operations.kids
  const max = maxNum[ageGroup] || maxNum.kids
  const count = difficulty === 'easy' ? 8 : difficulty === 'hard' ? 20 : 12
  
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    const a = Math.floor(Math.random() * max) + 1
    const b = Math.floor(Math.random() * (max / 2)) + 1
    const context = contexts[Math.floor(Math.random() * contexts.length)]
    let answer
    
    switch(op) {
      case '+': answer = a + b; break
      case '-': answer = Math.max(a, b) - Math.min(a, b); break
      case '×': answer = a * b; break
      case '÷': answer = Math.floor(a / b) || 1; break
      default: answer = a + b
    }
    
    problems.push({ 
      a: op === '-' ? Math.max(a, b) : a, 
      op, 
      b: op === '-' ? Math.min(a, b) : b, 
      answer,
      context,
      problem: `${op === '-' ? Math.max(a, b) : a} ${op} ${op === '-' ? Math.min(a, b) : b}`
    })
  }
  
  return {
    type: 'math',
    problems,
    theme,
    instructions: `Solve these ${theme || ''} math problems!`
  }
}

function generateSpellingActivity(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific spelling words
  const themeWords = {
    sports: ['SOCCER', 'TENNIS', 'HOCKEY', 'BASKET', 'TROPHY', 'PLAYER', 'COACH', 'SCORE'],
    food: ['APPLE', 'BANANA', 'ORANGE', 'PIZZA', 'COOKIE', 'BURGER', 'SALAD', 'BREAD'],
    animals: ['TIGER', 'ELEPHANT', 'GIRAFFE', 'MONKEY', 'RABBIT', 'TURTLE', 'PARROT', 'ZEBRA'],
    ocean: ['WHALE', 'SHARK', 'DOLPHIN', 'CORAL', 'SHELL', 'CRAB', 'TURTLE', 'WAVE'],
    space: ['PLANET', 'ROCKET', 'STAR', 'MOON', 'ORBIT', 'COMET', 'SATURN', 'MARS'],
    dinosaurs: ['FOSSIL', 'RAPTOR', 'TREX', 'BONE', 'SCALE', 'TEETH', 'CLAW', 'TAIL'],
    vehicles: ['TRUCK', 'PLANE', 'TRAIN', 'BOAT', 'BIKE', 'TAXI', 'SUBWAY', 'ROCKET'],
    nature: ['FLOWER', 'RIVER', 'FOREST', 'MOUNTAIN', 'CLOUD', 'RAINBOW', 'TREE', 'LEAF']
  }
  
  const words = themeWords[theme?.toLowerCase()] || themeWords.animals
  const selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6)
  
  // Scramble words
  const scrambled = selectedWords.map(word => {
    const arr = word.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.join('')
  })
  
  return {
    type: 'spelling',
    words: selectedWords,
    scrambled,
    theme,
    instructions: `Unscramble these ${theme || ''} words!`
  }
}

function generateTracingActivity(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific words to trace
  const themeTracingWords = {
    sports: ['BALL', 'GOAL', 'WIN', 'TEAM', 'RUN', 'KICK', 'JUMP', 'PLAY'],
    food: ['EAT', 'YUM', 'COOK', 'BITE', 'MEAL', 'FOOD', 'BAKE', 'MIX'],
    animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'BEAR', 'LION', 'FROG', 'BEE'],
    ocean: ['SEA', 'FISH', 'WAVE', 'CRAB', 'SWIM', 'DEEP', 'BLUE', 'SAND'],
    space: ['SUN', 'MOON', 'STAR', 'MARS', 'UFO', 'ORBIT', 'SKY', 'DARK'],
    dinosaurs: ['DINO', 'ROAR', 'BONE', 'TAIL', 'CLAW', 'HORN', 'EGG', 'BIG'],
    vehicles: ['CAR', 'BUS', 'VAN', 'JET', 'BOAT', 'BIKE', 'TAXI', 'ROAD'],
    nature: ['SUN', 'TREE', 'LEAF', 'BUD', 'RAIN', 'WIND', 'SEED', 'GROW']
  }
  
  const words = themeTracingWords[theme?.toLowerCase()] || themeTracingWords.animals
  const count = ageGroup === 'toddler' ? 4 : ageGroup === 'preschool' ? 5 : 6
  const selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'tracing',
    items: selectedWords,
    theme,
    instructions: `Trace these ${theme || ''} words carefully!`
  }
}

function generateMatchingActivity(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific matching pairs
  const themePairs = {
    sports: [['Soccer', 'Ball'], ['Tennis', 'Racket'], ['Hockey', 'Puck'], ['Baseball', 'Bat'], ['Golf', 'Club'], ['Swimming', 'Pool']],
    food: [['Apple', 'Red'], ['Banana', 'Yellow'], ['Pizza', 'Cheese'], ['Ice Cream', 'Cold'], ['Cake', 'Sweet'], ['Bread', 'Bakery']],
    animals: [['Cat', 'Meow'], ['Dog', 'Bark'], ['Bird', 'Fly'], ['Fish', 'Swim'], ['Lion', 'Roar'], ['Snake', 'Hiss']],
    ocean: [['Whale', 'Biggest'], ['Shark', 'Teeth'], ['Dolphin', 'Smart'], ['Crab', 'Claws'], ['Octopus', 'Arms'], ['Turtle', 'Shell']],
    space: [['Sun', 'Hot'], ['Moon', 'Night'], ['Star', 'Twinkle'], ['Rocket', 'Launch'], ['Planet', 'Orbit'], ['Comet', 'Tail']],
    dinosaurs: [['T-Rex', 'Teeth'], ['Triceratops', 'Horns'], ['Pterodactyl', 'Fly'], ['Stegosaurus', 'Plates'], ['Brachiosaurus', 'Tall'], ['Raptor', 'Fast']],
    vehicles: [['Car', 'Road'], ['Plane', 'Sky'], ['Boat', 'Water'], ['Train', 'Tracks'], ['Bike', 'Pedal'], ['Helicopter', 'Hover']],
    nature: [['Flower', 'Bloom'], ['Tree', 'Tall'], ['Rain', 'Wet'], ['Sun', 'Shine'], ['Leaf', 'Green'], ['Cloud', 'Fluffy']]
  }
  
  const pairs = themePairs[theme?.toLowerCase()] || themePairs.animals
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 6 : 5
  const selectedPairs = [...pairs].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'matching',
    pairs: selectedPairs,
    theme,
    instructions: `Match each ${theme || ''} word with its pair!`
  }
}

function generateCountingActivity(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific counting items (text-based for PDF compatibility)
  const themeItems = {
    sports: ['Ball', 'Goal', 'Medal', 'Trophy', 'Player', 'Team'],
    food: ['Apple', 'Pizza', 'Cookie', 'Cake', 'Banana', 'Orange'],
    animals: ['Cat', 'Dog', 'Bird', 'Fish', 'Lion', 'Elephant'],
    ocean: ['Whale', 'Shark', 'Dolphin', 'Crab', 'Octopus', 'Shell'],
    space: ['Star', 'Moon', 'Rocket', 'Planet', 'Sun', 'Comet'],
    dinosaurs: ['Dino', 'Egg', 'Bone', 'Fossil', 'Footprint', 'Fern'],
    vehicles: ['Car', 'Bus', 'Plane', 'Train', 'Boat', 'Bike'],
    nature: ['Flower', 'Tree', 'Sun', 'Cloud', 'Butterfly', 'Leaf']
  }
  
  const items = themeItems[theme?.toLowerCase()] || themeItems.animals
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6
  const countingItems = []
  const answers = []
  
  for (let i = 0; i < count; i++) {
    const item = items[Math.floor(Math.random() * items.length)]
    const num = Math.floor(Math.random() * 8) + 1
    countingItems.push({ item, count: num })
    answers.push(num)
  }
  
  return {
    type: 'counting',
    items: countingItems,
    answers,
    theme,
    instructions: `Count the ${theme || ''} items and write the number!`
  }
}

function generatePatternActivity(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific pattern items (text-based for PDF compatibility)
  const themePatternItems = {
    sports: ['Ball', 'Goal', 'Medal', 'Star', 'Trophy'],
    food: ['Apple', 'Banana', 'Orange', 'Grape', 'Cherry'],
    animals: ['Cat', 'Dog', 'Bird', 'Fish', 'Frog'],
    ocean: ['Whale', 'Shark', 'Dolphin', 'Crab', 'Fish'],
    space: ['Star', 'Moon', 'Rocket', 'Planet', 'Sun'],
    dinosaurs: ['Dino', 'Egg', 'Bone', 'Leaf', 'Rock'],
    vehicles: ['Car', 'Bus', 'Plane', 'Train', 'Boat'],
    nature: ['Flower', 'Tree', 'Sun', 'Cloud', 'Leaf']
  }
  
  const items = themePatternItems[theme?.toLowerCase()] || themePatternItems.animals
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4
  const patterns = []
  
  for (let i = 0; i < count; i++) {
    // Select 2-3 items for the pattern
    const patternItems = [...items].sort(() => Math.random() - 0.5).slice(0, 2 + (i % 2))
    const patternType = i % 3 // 0: ABAB, 1: AABB, 2: ABC
    let sequence = []
    let answer = ''
    
    if (patternType === 0) {
      // ABAB pattern
      sequence = [patternItems[0], patternItems[1], patternItems[0], patternItems[1], '?']
      answer = patternItems[0]
    } else if (patternType === 1) {
      // AABB pattern
      sequence = [patternItems[0], patternItems[0], patternItems[1], patternItems[1], patternItems[0], '?']
      answer = patternItems[0]
    } else {
      // ABC pattern
      sequence = [patternItems[0], patternItems[1], patternItems[0], patternItems[1], patternItems[0], '?']
      answer = patternItems[1]
    }
    
    patterns.push({ sequence, answer })
  }
  
  return {
    type: 'patterns',
    patterns,
    theme,
    instructions: `What comes next in each ${theme || ''} pattern?`
  }
}

async function generateWouldYouRather(theme, difficulty, ageGroup) {
  const themedQuestions = {
    sports: [
      'Would you rather be a famous soccer player or a famous basketball player?',
      'Would you rather win an Olympic gold medal or a World Cup trophy?',
      'Would you rather be the fastest runner or the strongest weightlifter?',
      'Would you rather play on a team or compete in individual sports?',
      'Would you rather be a coach or a referee?'
    ],
    food: [
      'Would you rather only eat pizza or only eat ice cream for a week?',
      'Would you rather have a chocolate fountain or a pizza vending machine at home?',
      'Would you rather eat only sweet foods or only salty foods?',
      'Would you rather be a chef or a food taster?',
      'Would you rather have unlimited candy or unlimited fruit?'
    ],
    animals: [
      'Would you rather have a pet dragon or a pet unicorn?',
      'Would you rather swim like a dolphin or fly like an eagle?',
      'Would you rather be able to talk to animals or speak every human language?',
      'Would you rather be as strong as a gorilla or as fast as a cheetah?',
      'Would you rather have a lion or an elephant as your best friend?'
    ],
    ocean: [
      'Would you rather be a dolphin or a shark?',
      'Would you rather explore a coral reef or a deep sea trench?',
      'Would you rather have gills to breathe underwater or echolocation like a whale?',
      'Would you rather ride a whale or swim with a school of fish?',
      'Would you rather find buried treasure or discover a new sea creature?'
    ],
    space: [
      'Would you rather visit outer space or the bottom of the ocean?',
      'Would you rather live on Mars or the Moon?',
      'Would you rather be an astronaut or an alien explorer?',
      'Would you rather discover a new planet or a new star?',
      'Would you rather travel at the speed of light or teleport anywhere instantly?'
    ],
    dinosaurs: [
      'Would you rather ride a T-Rex or a Pterodactyl?',
      'Would you rather be a paleontologist or a time traveler to the dinosaur age?',
      'Would you rather have a pet baby dinosaur or find a real dinosaur egg?',
      'Would you rather be as big as a Brachiosaurus or as fast as a Velociraptor?',
      'Would you rather discover a new dinosaur species or bring one back to life?'
    ],
    vehicles: [
      'Would you rather fly a plane or captain a ship?',
      'Would you rather have a flying car or a submarine car?',
      'Would you rather drive the fastest race car or the biggest truck?',
      'Would you rather travel by helicopter or by hot air balloon?',
      'Would you rather build rockets or design trains?'
    ],
    nature: [
      'Would you rather live in a treehouse or in a cave?',
      'Would you rather control the weather or talk to plants?',
      'Would you rather be able to grow any plant instantly or never need sleep?',
      'Would you rather climb the tallest mountain or swim in every ocean?',
      'Would you rather see a rainbow every day or never feel cold?'
    ],
    math: [
      'Would you rather be super fast at mental math or never make a calculation mistake?',
      'Would you rather have unlimited math homework or no recess for a week?',
      'Would you rather count to a million or solve 100 hard math problems?',
      'Would you rather only communicate using numbers or only use addition?',
      'Would you rather be a famous mathematician or a famous scientist?'
    ],
    school: [
      'Would you rather have no homework forever or have an extra hour of recess every day?',
      'Would you rather be the smartest kid in class or the most popular?',
      'Would you rather have a robot teacher or teach the class yourself for a day?',
      'Would you rather have school in a treehouse or on a boat?',
      'Would you rather have all A grades or be captain of every sports team?'
    ]
  }
  
  // Check for AI-generated content first
  let aiContent = null
  const themedContentCheck = getThemedContent(theme)
  if (themedContentCheck.needsAIGeneration && theme) {
    aiContent = await generateAIThemedContent(theme)
  }
  
  // If AI content has would you rather questions, use those
  if (aiContent && aiContent.wouldYouRather && aiContent.wouldYouRather.length > 0) {
    const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
    const questions = [...aiContent.wouldYouRather].sort(() => Math.random() - 0.5).slice(0, count)
    return {
      type: 'would-you-rather',
      questions,
      theme,
      instructions: `Circle your ${theme || ''} choice and explain why!`
    }
  }
  
  // Find matching theme from predefined
  let questions = themedQuestions.animals
  const normalizedTheme = theme?.toLowerCase() || ''
  for (const [key, value] of Object.entries(themedQuestions)) {
    if (normalizedTheme.includes(key)) {
      questions = value
      break
    }
  }
  
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
  const selectedQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'would-you-rather',
    questions: selectedQuestions,
    theme,
    instructions: `Circle your ${theme || ''} choice and explain why!`
  }
}

async function generateTrivia(theme, difficulty, ageGroup) {
  // Check for AI-generated content first
  let aiContent = null
  const themedContentCheck = getThemedContent(theme)
  if (themedContentCheck.needsAIGeneration && theme) {
    aiContent = await generateAIThemedContent(theme)
  }
  
  // If AI content has trivia questions, use those
  if (aiContent && aiContent.triviaQuestions && aiContent.triviaQuestions.length > 0) {
    const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
    const questions = [...aiContent.triviaQuestions].sort(() => Math.random() - 0.5).slice(0, count)
    return {
      type: 'trivia',
      questions: questions.map(q => ({ ...q, correct: q.a })),
      theme,
      instructions: `Test your ${theme || ''} knowledge! Circle the correct answer.`
    }
  }
  
  const themedTrivia = {
    sports: [
      { q: 'How many players are on a soccer team?', a: '11', options: ['9', '11', '13'] },
      { q: 'What sport uses a racket and shuttlecock?', a: 'Badminton', options: ['Tennis', 'Badminton', 'Squash'] },
      { q: 'In basketball, how many points is a free throw?', a: '1', options: ['1', '2', '3'] },
      { q: 'What is the fastest sport on grass?', a: 'Polo', options: ['Soccer', 'Polo', 'Cricket'] },
      { q: 'How many holes are on a golf course?', a: '18', options: ['9', '18', '21'] }
    ],
    food: [
      { q: 'What country is pizza originally from?', a: 'Italy', options: ['USA', 'Italy', 'France'] },
      { q: 'What vitamin do carrots have lots of?', a: 'Vitamin A', options: ['Vitamin A', 'Vitamin C', 'Vitamin D'] },
      { q: 'What is the main ingredient in bread?', a: 'Flour', options: ['Rice', 'Flour', 'Sugar'] },
      { q: 'Which fruit has its seeds on the outside?', a: 'Strawberry', options: ['Apple', 'Strawberry', 'Orange'] },
      { q: 'What do bees make?', a: 'Honey', options: ['Sugar', 'Honey', 'Syrup'] }
    ],
    animals: [
      { q: 'What is the largest animal?', a: 'Blue Whale', options: ['Elephant', 'Blue Whale', 'Giraffe'] },
      { q: 'How many legs does a spider have?', a: '8', options: ['6', '8', '10'] },
      { q: 'What is a baby kangaroo called?', a: 'Joey', options: ['Cub', 'Joey', 'Pup'] },
      { q: 'Which bird cannot fly?', a: 'Penguin', options: ['Penguin', 'Eagle', 'Parrot'] },
      { q: 'What is the fastest land animal?', a: 'Cheetah', options: ['Lion', 'Cheetah', 'Horse'] }
    ],
    ocean: [
      { q: 'What is the largest ocean animal?', a: 'Blue Whale', options: ['Shark', 'Blue Whale', 'Octopus'] },
      { q: 'How many arms does an octopus have?', a: '8', options: ['6', '8', '10'] },
      { q: 'What sea creature has a shell?', a: 'Turtle', options: ['Dolphin', 'Turtle', 'Shark'] },
      { q: 'What is a group of dolphins called?', a: 'Pod', options: ['School', 'Pod', 'Herd'] },
      { q: 'Which is the largest ocean?', a: 'Pacific', options: ['Atlantic', 'Pacific', 'Indian'] }
    ],
    space: [
      { q: 'What planet is known as the Red Planet?', a: 'Mars', options: ['Venus', 'Mars', 'Jupiter'] },
      { q: 'How many planets are in our solar system?', a: '8', options: ['7', '8', '9'] },
      { q: 'What is the closest star to Earth?', a: 'The Sun', options: ['The Sun', 'North Star', 'Sirius'] },
      { q: 'Which planet has the most moons?', a: 'Saturn', options: ['Jupiter', 'Saturn', 'Neptune'] },
      { q: 'What do astronauts wear in space?', a: 'Space suit', options: ['Wetsuit', 'Space suit', 'Jumpsuit'] }
    ],
    dinosaurs: [
      { q: 'What does T-Rex stand for?', a: 'Tyrant Lizard King', options: ['Tall Rex', 'Tyrant Lizard King', 'Terrible Rex'] },
      { q: 'Which dinosaur could fly?', a: 'Pterodactyl', options: ['T-Rex', 'Pterodactyl', 'Triceratops'] },
      { q: 'What do we call scientists who study dinosaurs?', a: 'Paleontologists', options: ['Biologists', 'Paleontologists', 'Geologists'] },
      { q: 'How many horns did Triceratops have?', a: '3', options: ['2', '3', '4'] },
      { q: 'Were dinosaurs reptiles or mammals?', a: 'Reptiles', options: ['Mammals', 'Reptiles', 'Birds'] }
    ],
    vehicles: [
      { q: 'How many wheels does a bicycle have?', a: '2', options: ['2', '3', '4'] },
      { q: 'What vehicle travels on tracks?', a: 'Train', options: ['Car', 'Train', 'Boat'] },
      { q: 'What vehicle can go underwater?', a: 'Submarine', options: ['Airplane', 'Submarine', 'Helicopter'] },
      { q: 'What is the fastest production car?', a: 'Bugatti', options: ['Ferrari', 'Bugatti', 'Lamborghini'] },
      { q: 'What powers most electric cars?', a: 'Battery', options: ['Gasoline', 'Battery', 'Steam'] }
    ],
    nature: [
      { q: 'What is the tallest type of tree?', a: 'Redwood', options: ['Oak', 'Redwood', 'Pine'] },
      { q: 'How many colors are in a rainbow?', a: '7', options: ['5', '7', '9'] },
      { q: 'What do plants need to make food?', a: 'Sunlight', options: ['Darkness', 'Sunlight', 'Salt'] },
      { q: 'What is the longest river?', a: 'Nile', options: ['Amazon', 'Nile', 'Mississippi'] },
      { q: 'What season do leaves fall?', a: 'Autumn', options: ['Spring', 'Autumn', 'Winter'] }
    ],
    math: [
      { q: 'What is 7 + 8?', a: '15', options: ['14', '15', '16'] },
      { q: 'How many sides does a hexagon have?', a: '6', options: ['5', '6', '8'] },
      { q: 'What is 12 × 12?', a: '144', options: ['124', '144', '156'] },
      { q: 'What is the square root of 64?', a: '8', options: ['6', '8', '10'] },
      { q: 'How many degrees in a right angle?', a: '90', options: ['45', '90', '180'] }
    ],
    school: [
      { q: 'How many letters are in the alphabet?', a: '26', options: ['24', '26', '28'] },
      { q: 'What is the capital of the United States?', a: 'Washington D.C.', options: ['New York', 'Washington D.C.', 'Los Angeles'] },
      { q: 'How many continents are there?', a: '7', options: ['5', '6', '7'] },
      { q: 'What is H2O commonly known as?', a: 'Water', options: ['Oxygen', 'Water', 'Hydrogen'] },
      { q: 'What do you call a shape with 4 equal sides?', a: 'Square', options: ['Rectangle', 'Square', 'Triangle'] }
    ]
  }
  
  // Find matching theme
  let questions = themedTrivia.animals
  const normalizedTheme = theme?.toLowerCase() || ''
  for (const [key, value] of Object.entries(themedTrivia)) {
    if (normalizedTheme.includes(key)) {
      questions = value
      break
    }
  }
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
  const selectedQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'trivia',
    questions: selectedQuestions.map(q => ({ ...q, correct: q.a })),
    theme,
    instructions: `Test your ${theme || ''} knowledge! Circle the correct answer.`
  }
}

function generateTicTacToe(theme, difficulty, ageGroup) {
  return {
    type: 'tic-tac-toe',
    grids: difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6,
    theme,
    instructions: 'Play Tic-Tac-Toe with a friend! Take turns placing X and O.'
  }
}

async function generateHangman(theme, difficulty, ageGroup) {
  const themedWords = {
    sports: ['BASKETBALL', 'SOCCER', 'TENNIS', 'SWIMMING', 'BASEBALL', 'HOCKEY', 'FOOTBALL', 'VOLLEYBALL'],
    food: ['SPAGHETTI', 'HAMBURGER', 'CHOCOLATE', 'SANDWICH', 'PANCAKES', 'CUPCAKE', 'POPCORN', 'SMOOTHIE'],
    animals: ['ELEPHANT', 'PENGUIN', 'DOLPHIN', 'BUTTERFLY', 'KANGAROO', 'GIRAFFE', 'CROCODILE', 'FLAMINGO'],
    ocean: ['JELLYFISH', 'STARFISH', 'SEAHORSE', 'OCTOPUS', 'SEAWEED', 'DOLPHIN', 'MERMAID', 'TREASURE'],
    space: ['ASTEROID', 'SATELLITE', 'GALAXY', 'NEBULA', 'ASTRONAUT', 'SPACESHIP', 'UNIVERSE', 'TELESCOPE'],
    dinosaurs: ['DINOSAUR', 'TRICERATOPS', 'PTERODACTYL', 'RAPTOR', 'FOSSIL', 'PREHISTORIC', 'JURASSIC', 'SKELETON'],
    vehicles: ['HELICOPTER', 'SUBMARINE', 'MOTORCYCLE', 'AMBULANCE', 'EXCAVATOR', 'TRACTOR', 'LIMOUSINE', 'SAILBOAT'],
    nature: ['BUTTERFLY', 'WATERFALL', 'MOUNTAIN', 'RAINBOW', 'SUNFLOWER', 'HURRICANE', 'TORNADO', 'GLACIER'],
    math: ['ADDITION', 'SUBTRACT', 'MULTIPLY', 'DIVISION', 'FRACTION', 'GEOMETRY', 'EQUATION', 'TRIANGLE'],
    school: ['HOMEWORK', 'CLASSROOM', 'TEXTBOOK', 'NOTEBOOK', 'BACKPACK', 'PRINCIPAL', 'CAFETERIA', 'ALPHABET']
  }
  
  // Check for AI-generated content first
  let aiContent = null
  const themedContentCheck = getThemedContent(theme)
  if (themedContentCheck.needsAIGeneration && theme) {
    aiContent = await generateAIThemedContent(theme)
  }
  
  // If AI content has hangman words, use those
  if (aiContent && aiContent.hangmanWords && aiContent.hangmanWords.length > 0) {
    const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4
    const words = [...aiContent.hangmanWords].sort(() => Math.random() - 0.5).slice(0, count)
    return {
      type: 'hangman',
      words,
      theme,
      instructions: `Guess the ${theme || ''} words before the hangman is complete!`
    }
  }
  
  // Find matching theme from predefined
  let words = themedWords.animals
  const normalizedTheme = theme?.toLowerCase() || ''
  for (const [key, value] of Object.entries(themedWords)) {
    if (normalizedTheme.includes(key)) {
      words = value
      break
    }
  }
  
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4
  const selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'hangman',
    words: selectedWords,
    theme,
    instructions: `Guess the ${theme || ''} words before the hangman is complete!`
  }
}

async function generateBingo(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  return {
    type: 'bingo',
    cards: difficulty === 'easy' ? 2 : difficulty === 'hard' ? 6 : 4,
    items: themedContent.memoryItems || ['Star', 'Heart', 'Moon', 'Sun'],
    theme,
    instructions: `Play ${theme || ''} Bingo with friends and family!`
  }
}

function generateTravelGames(theme, difficulty, ageGroup) {
  const themedGames = {
    sports: ['Sports I Spy', 'Jersey Number Hunt', 'Stadium Scavenger Hunt', 'Team Logo Bingo'],
    food: ['Food I Spy', 'Restaurant Sign Hunt', 'Snack Scavenger Hunt', 'Menu Bingo'],
    animals: ['Animal I Spy', 'Farm Animal Hunt', 'Wildlife Scavenger Hunt', 'Animal Bingo'],
    ocean: ['Beach I Spy', 'Shell Collecting', 'Ocean Scavenger Hunt', 'Sea Life Bingo'],
    space: ['Star Gazing List', 'Constellation Hunt', 'Night Sky Scavenger Hunt', 'Planet Bingo'],
    dinosaurs: ['Fossil Hunt Game', 'Dino Name Race', 'Museum Scavenger Hunt', 'Dinosaur Bingo'],
    vehicles: ['Vehicle I Spy', 'License Plate Hunt', 'Road Trip Scavenger Hunt', 'Car Bingo'],
    nature: ['Nature I Spy', 'Tree Identification', 'Outdoor Scavenger Hunt', 'Bird Bingo']
  }
  
  const games = themedGames[theme?.toLowerCase()] || themedGames.animals
  
  return {
    type: 'travel-games',
    games,
    theme,
    instructions: `Fun ${theme || ''} games to play on your next trip!`
  }
}

async function generateColorByNumber(theme, difficulty, ageGroup) {
  // Theme-specific color schemes
  const themeColors = {
    sports: { 1: 'Green (Field)', 2: 'White (Ball)', 3: 'Red (Jersey)', 4: 'Blue (Sky)', 5: 'Brown (Bat)', 6: 'Yellow (Trophy)' },
    food: { 1: 'Red (Tomato)', 2: 'Yellow (Cheese)', 3: 'Green (Lettuce)', 4: 'Brown (Bread)', 5: 'Orange (Carrot)', 6: 'Pink (Strawberry)' },
    animals: { 1: 'Brown (Fur)', 2: 'Green (Grass)', 3: 'Blue (Water)', 4: 'Yellow (Sun)', 5: 'Gray (Elephant)', 6: 'Orange (Tiger)' },
    ocean: { 1: 'Blue (Water)', 2: 'Green (Seaweed)', 3: 'Orange (Fish)', 4: 'Yellow (Sand)', 5: 'Purple (Coral)', 6: 'Gray (Dolphin)' },
    space: { 1: 'Black (Space)', 2: 'Yellow (Stars)', 3: 'Red (Mars)', 4: 'Blue (Earth)', 5: 'White (Moon)', 6: 'Orange (Sun)' },
    dinosaurs: { 1: 'Green (Scales)', 2: 'Brown (Ground)', 3: 'Blue (Sky)', 4: 'Red (Lava)', 5: 'Yellow (Eyes)', 6: 'Gray (Rocks)' },
    vehicles: { 1: 'Red (Car)', 2: 'Blue (Plane)', 3: 'Yellow (Bus)', 4: 'Gray (Road)', 5: 'White (Boat)', 6: 'Black (Tires)' },
    nature: { 1: 'Green (Leaves)', 2: 'Brown (Trunk)', 3: 'Blue (Sky)', 4: 'Yellow (Sun)', 5: 'Pink (Flowers)', 6: 'White (Clouds)' }
  }
  
  let colors = themeColors[theme?.toLowerCase()]
  let pictureDescription = ''
  
  // Generate theme-specific colors and picture for custom themes
  if (!colors && theme) {
    const themedContent = getThemedContent(theme)
    if (themedContent.needsAIGeneration) {
      const aiContent = await generateAIThemedContent(theme)
      if (aiContent.colorByNumberColors) {
        colors = aiContent.colorByNumberColors
      }
      if (aiContent.colorByNumberPicture) {
        pictureDescription = aiContent.colorByNumberPicture
      }
    }
  }
  
  // Fallback colors with theme context
  if (!colors) {
    colors = { 
      1: `Red (${theme} element)`, 
      2: `Blue (${theme} sky/water)`, 
      3: `Green (${theme} nature)`, 
      4: `Yellow (${theme} highlight)`, 
      5: `Orange (${theme} accent)`, 
      6: `Purple (${theme} magic/special)` 
    }
  }
  
  return {
    type: 'color-by-number',
    colors,
    pictureDescription: pictureDescription || `A ${theme} themed picture`,
    theme,
    instructions: `Color each numbered section to reveal a ${theme || 'fun'} picture!`
  }
}

async function generateDoodleComplete(theme, difficulty, ageGroup) {
  // Theme-specific doodle prompts
  const themedPrompts = {
    sports: ['Complete the soccer ball', 'Add details to the trophy', 'Finish the athlete', 'Draw the missing equipment'],
    food: ['Complete the pizza', 'Add toppings to the burger', 'Finish the ice cream cone', 'Draw the missing fruit'],
    animals: ['Complete the lion\'s mane', 'Add spots to the giraffe', 'Finish the butterfly wings', 'Draw the cat\'s face'],
    ocean: ['Complete the fish scales', 'Add tentacles to the octopus', 'Finish the whale', 'Draw the coral reef'],
    space: ['Complete the rocket ship', 'Add craters to the moon', 'Finish the alien', 'Draw the planet rings'],
    dinosaurs: ['Complete the T-Rex teeth', 'Add plates to the Stegosaurus', 'Finish the dinosaur egg', 'Draw the footprints'],
    vehicles: ['Complete the race car', 'Add wheels to the bus', 'Finish the airplane wings', 'Draw the boat sails'],
    nature: ['Complete the flower petals', 'Add leaves to the tree', 'Finish the rainbow', 'Draw the butterfly pattern']
  }
  
  let prompts = themedPrompts[theme?.toLowerCase()]
  
  // Generate AI prompts for custom themes
  if (!prompts && theme) {
    const themedContent = getThemedContent(theme)
    if (themedContent.needsAIGeneration) {
      const aiContent = await generateAIThemedContent(theme)
      if (aiContent.doodlePrompts && aiContent.doodlePrompts.length > 0) {
        prompts = aiContent.doodlePrompts
      }
    }
  }
  
  // Fallback with theme context
  if (!prompts || prompts.length === 0) {
    prompts = [
      `Complete the ${theme} character`,
      `Add magical details to this ${theme} scene`,
      `Finish the ${theme} creature`,
      `Draw the missing ${theme} elements`
    ]
  }
  
  const count = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3
  const selectedPrompts = [...prompts].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'doodle-complete',
    prompts: selectedPrompts,
    theme,
    instructions: `Use your imagination to complete each ${theme || ''} doodle!`
  }
}

async function generateDrawingPrompts(theme, difficulty, ageGroup) {
  // Theme-specific drawing prompts
  const themedPrompts = {
    sports: [
      'Draw your favorite sports player',
      'Draw a trophy you would like to win',
      'Draw yourself playing a sport',
      'Draw a stadium full of fans',
      'Draw the winning goal moment'
    ],
    food: [
      'Draw your favorite meal',
      'Draw a magical kitchen',
      'Draw the biggest cake ever',
      'Draw a fruit character',
      'Draw a food you\'d invent'
    ],
    animals: [
      'Draw your dream pet',
      'Draw animals having a party',
      'Draw a magical creature',
      'Draw animals at the zoo',
      'Draw an underwater animal scene'
    ],
    ocean: [
      'Draw an underwater city',
      'Draw a friendly sea monster',
      'Draw a treasure chest',
      'Draw a coral reef scene',
      'Draw life in a submarine'
    ],
    space: [
      'Draw an alien friend',
      'Draw your own planet',
      'Draw a space station',
      'Draw astronauts on the moon',
      'Draw a spaceship of the future'
    ],
    dinosaurs: [
      'Draw your favorite dinosaur',
      'Draw dinosaurs in your backyard',
      'Draw a dinosaur family',
      'Draw a fossil discovery',
      'Draw a dinosaur hatchling'
    ],
    vehicles: [
      'Draw your dream car',
      'Draw a flying vehicle',
      'Draw a vehicle of the future',
      'Draw a busy highway scene',
      'Draw a vehicle adventure'
    ],
    nature: [
      'Draw a magical forest',
      'Draw the perfect treehouse',
      'Draw a beautiful garden',
      'Draw animals in nature',
      'Draw a rainbow scene'
    ]
  }
  
  let prompts = themedPrompts[theme?.toLowerCase()]
  
  // Generate AI prompts for custom themes
  if (!prompts && theme) {
    const themedContent = getThemedContent(theme)
    if (themedContent.needsAIGeneration) {
      const aiContent = await generateAIThemedContent(theme)
      if (aiContent.drawingPrompts && aiContent.drawingPrompts.length > 0) {
        prompts = aiContent.drawingPrompts
      }
    }
  }
  
  // Fallback with theme context
  if (!prompts || prompts.length === 0) {
    prompts = [
      `Draw your favorite ${theme} character`,
      `Draw a magical ${theme} scene`,
      `Draw yourself in a ${theme} adventure`,
      `Draw a ${theme} creature or object`,
      `Draw your dream ${theme} world`
    ]
  }
  
  const count = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3
  const selectedPrompts = [...prompts].sort(() => Math.random() - 0.5).slice(0, count)
  
  return {
    type: 'drawing-prompts',
    prompts: selectedPrompts,
    theme,
    instructions: `Draw what the ${theme || ''} prompt asks in the box below!`
  }
}

async function generateConnectColor(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Theme-specific connect and color descriptions
  const themeDescriptions = {
    sports: 'Connect the dots to reveal sports equipment, then color it in!',
    food: 'Connect the dots to reveal yummy food, then color it in!',
    animals: 'Connect the dots to reveal an animal friend, then color it in!',
    ocean: 'Connect the dots to reveal sea creatures, then color it in!',
    space: 'Connect the dots to reveal space objects, then color it in!',
    dinosaurs: 'Connect the dots to reveal a dinosaur, then color it in!',
    vehicles: 'Connect the dots to reveal a vehicle, then color it in!',
    nature: 'Connect the dots to reveal nature, then color it in!'
  }
  
  let description = themeDescriptions[theme?.toLowerCase()]
  let pictureHint = ''
  
  // Generate AI content for custom themes
  if (!description && theme) {
    if (themedContent.needsAIGeneration) {
      const aiContent = await generateAIThemedContent(theme)
      if (aiContent.connectColorPictures && aiContent.connectColorPictures.length > 0) {
        const randomPicture = aiContent.connectColorPictures[Math.floor(Math.random() * aiContent.connectColorPictures.length)]
        pictureHint = randomPicture
        description = `Connect the dots to reveal a ${randomPicture}, then color it in!`
      }
    }
  }
  
  // Fallback with theme context
  if (!description) {
    description = `Connect the dots to reveal a magical ${theme} picture, then color it in!`
  }
  
  return {
    type: 'connect-color',
    dots: difficulty === 'easy' ? 15 : difficulty === 'hard' ? 40 : 25,
    pictureHint,
    theme,
    instructions: description
  }
}

// ========== THEME-SPECIFIC CONTENT POOLS ==========
const THEMED_CONTENT = {
  sports: {
    riddles: [
      { riddle: "I have laces but I'm not a shoe for walking. Athletes wear me to run fast. What am I?", answer: 'Running shoes/Cleats' },
      { riddle: "I'm round and bouncy, you throw me through a hoop. What am I?", answer: 'Basketball' },
      { riddle: "I have 18 holes but I'm not Swiss cheese. What am I?", answer: 'Golf course' },
      { riddle: "You hit me with a bat but I don't get hurt. What am I?", answer: 'Baseball' },
      { riddle: "I'm kicked around but never cry. I go in a net to score. What am I?", answer: 'Soccer ball' },
      { riddle: "I have strings but make no music. You swing me to hit a ball. What am I?", answer: 'Tennis racket' },
      { riddle: "I'm frozen and flat, players skate on me. What am I?", answer: 'Ice rink' },
      { riddle: "I have a net but catch no fish. Shuttlecocks fly over me. What am I?", answer: 'Badminton net' },
      { riddle: "Athletes pass me but I never move on my own. I help relay teams win. What am I?", answer: 'Baton' },
      { riddle: "I'm thrown far but always come back to be thrown again. What am I?", answer: 'Discus/Javelin' }
    ],
    logicPuzzles: [
      { clues: ['Soccer is not first', 'Basketball comes before Tennis', 'Swimming is last'], items: ['Soccer', 'Basketball', 'Tennis', 'Swimming'] },
      { clues: ['The gold medal is first', 'Bronze is after silver', 'Silver is not last'], items: ['Gold', 'Silver', 'Bronze', 'Ribbon'] },
      { clues: ['The goalkeeper is not the captain', 'The striker scores the most', 'The defender is before midfielder'], items: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'] }
    ],
    memoryItems: ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football', 'Hockey', 'Golf', 'Swimming', 'Running', 'Boxing'],
    wordSearchWords: ['SOCCER', 'GOAL', 'TEAM', 'SCORE', 'BALL', 'WIN', 'COACH', 'GAME', 'RACE', 'SPORT'],
    mazeTheme: { start: 'ATHLETE', end: 'TROPHY', instruction: 'Help the athlete reach the trophy!' },
    visualContext: 'sports equipment'
  },
  food: {
    riddles: [
      { riddle: "I'm yellow and curved, monkeys love me. What am I?", answer: 'Banana' },
      { riddle: "I make you cry but I'm not sad. You cut me in the kitchen. What am I?", answer: 'Onion' },
      { riddle: "I'm red and round, keep doctors away. What am I?", answer: 'Apple' },
      { riddle: "I'm white and come from cows. You pour me on cereal. What am I?", answer: 'Milk' },
      { riddle: "I have eyes but cannot see. I grow underground. What am I?", answer: 'Potato' },
      { riddle: "I'm long and orange, rabbits love to eat me. What am I?", answer: 'Carrot' },
      { riddle: "I'm round with cheese and toppings. I come in slices. What am I?", answer: 'Pizza' },
      { riddle: "I crack open but I'm not broken. You eat me for breakfast. What am I?", answer: 'Egg' },
      { riddle: "I'm cold and sweet, you eat me in summer with a cone. What am I?", answer: 'Ice cream' },
      { riddle: "I'm bread with filling in the middle. Great for lunch! What am I?", answer: 'Sandwich' }
    ],
    logicPuzzles: [
      { clues: ['Pizza is not first', 'Salad comes before dessert', 'Soup is the first course'], items: ['Soup', 'Salad', 'Pizza', 'Dessert'] },
      { clues: ['Breakfast is first', 'Dinner is after lunch', 'Snack is between lunch and dinner'], items: ['Breakfast', 'Lunch', 'Snack', 'Dinner'] },
      { clues: ['The apple is red', 'The banana is not next to the orange', 'The grape is last'], items: ['Apple', 'Banana', 'Orange', 'Grape'] }
    ],
    memoryItems: ['Pizza', 'Apple', 'Cake', 'Burger', 'Ice Cream', 'Cookie', 'Banana', 'Carrot', 'Donut', 'Sandwich'],
    wordSearchWords: ['PIZZA', 'APPLE', 'CAKE', 'BREAD', 'FRUIT', 'COOK', 'EAT', 'YUMMY', 'SWEET', 'LUNCH'],
    mazeTheme: { start: 'CHEF', end: 'CAKE', instruction: 'Help the chef reach the cake!' },
    visualContext: 'food items'
  },
  animals: {
    riddles: [
      { riddle: "I'm the king of the jungle but I don't wear a crown. What am I?", answer: 'Lion' },
      { riddle: "I have a long neck and eat leaves from tall trees. What am I?", answer: 'Giraffe' },
      { riddle: "I'm black and white and love bamboo. What am I?", answer: 'Panda' },
      { riddle: "I have eight legs and spin webs. What am I?", answer: 'Spider' },
      { riddle: "I'm slow and carry my house on my back. What am I?", answer: 'Snail/Turtle' },
      { riddle: "I hop and have a pouch for my baby. What am I?", answer: 'Kangaroo' },
      { riddle: "I bark and wag my tail when happy. What am I?", answer: 'Dog' },
      { riddle: "I have stripes and look like a horse. What am I?", answer: 'Zebra' },
      { riddle: "I'm pink and love mud baths. What am I?", answer: 'Pig' },
      { riddle: "I have a trunk but never pack for vacation. What am I?", answer: 'Elephant' }
    ],
    logicPuzzles: [
      { clues: ['The lion is not first', 'The elephant is after the zebra', 'The giraffe is last'], items: ['Zebra', 'Lion', 'Elephant', 'Giraffe'] },
      { clues: ['The cat is smaller than the dog', 'The horse is the biggest', 'The rabbit is not last'], items: ['Cat', 'Rabbit', 'Dog', 'Horse'] },
      { clues: ['The bird can fly', 'The fish is in water', 'The snake is not first'], items: ['Bird', 'Fish', 'Snake', 'Frog'] }
    ],
    memoryItems: ['Lion', 'Elephant', 'Giraffe', 'Zebra', 'Monkey', 'Tiger', 'Bear', 'Panda', 'Kangaroo', 'Penguin'],
    wordSearchWords: ['LION', 'TIGER', 'BEAR', 'BIRD', 'FISH', 'DOG', 'CAT', 'ZEBRA', 'PANDA', 'FROG'],
    mazeTheme: { start: 'MOUSE', end: 'CHEESE', instruction: 'Help the mouse find the cheese!' },
    visualContext: 'animals'
  },
  ocean: {
    riddles: [
      { riddle: "I'm the biggest animal in the sea but I'm not a fish. What am I?", answer: 'Whale' },
      { riddle: "I have eight arms and squirt ink. What am I?", answer: 'Octopus' },
      { riddle: "I look like a star but live in the ocean. What am I?", answer: 'Starfish' },
      { riddle: "I have claws and walk sideways on the beach. What am I?", answer: 'Crab' },
      { riddle: "I'm smart and jump through hoops. I'm not a fish but live in water. What am I?", answer: 'Dolphin' },
      { riddle: "I have a shell and live on the beach. What am I?", answer: 'Seashell/Clam' },
      { riddle: "I'm a fish with sharp teeth that scares swimmers. What am I?", answer: 'Shark' },
      { riddle: "I move slowly and have a shell like a rock. What am I?", answer: 'Sea turtle' },
      { riddle: "I'm colorful and live in coral reefs. What am I?", answer: 'Tropical fish' },
      { riddle: "I sting but I'm not a bee. I float in the ocean. What am I?", answer: 'Jellyfish' }
    ],
    logicPuzzles: [
      { clues: ['The whale is the biggest', 'The shrimp is smaller than the crab', 'The dolphin is not last'], items: ['Shrimp', 'Crab', 'Dolphin', 'Whale'] },
      { clues: ['The starfish is on the sand', 'The shark swims fastest', 'The turtle is slow'], items: ['Starfish', 'Turtle', 'Fish', 'Shark'] },
      { clues: ['Coral is not moving', 'The octopus has 8 arms', 'The jellyfish stings'], items: ['Coral', 'Jellyfish', 'Octopus', 'Clam'] }
    ],
    memoryItems: ['Whale', 'Dolphin', 'Shark', 'Octopus', 'Crab', 'Starfish', 'Turtle', 'Jellyfish', 'Seahorse', 'Clam'],
    wordSearchWords: ['WHALE', 'SHARK', 'FISH', 'OCEAN', 'WAVE', 'CORAL', 'CRAB', 'SHELL', 'SWIM', 'DEEP'],
    mazeTheme: { start: 'DIVER', end: 'TREASURE', instruction: 'Help the diver find the treasure!' },
    visualContext: 'sea creatures'
  },
  space: {
    riddles: [
      { riddle: "I light up the night sky but I'm not the sun. What am I?", answer: 'Moon' },
      { riddle: "I'm a big ball of fire that gives Earth light. What am I?", answer: 'Sun' },
      { riddle: "I have rings but I'm not jewelry. I'm a planet. What am I?", answer: 'Saturn' },
      { riddle: "I travel through space and have a tail of ice. What am I?", answer: 'Comet' },
      { riddle: "I'm the red planet that might have had water. What am I?", answer: 'Mars' },
      { riddle: "Astronauts ride in me to go to space. What am I?", answer: 'Rocket' },
      { riddle: "I'm a group of stars that make a picture in the sky. What am I?", answer: 'Constellation' },
      { riddle: "I orbit Earth and help with communication. What am I?", answer: 'Satellite' },
      { riddle: "I'm where astronauts live in space. What am I?", answer: 'Space station' },
      { riddle: "I'm a hole in space that nothing can escape. What am I?", answer: 'Black hole' }
    ],
    logicPuzzles: [
      { clues: ['Mercury is closest to the Sun', 'Earth is after Venus', 'Mars is the red planet'], items: ['Mercury', 'Venus', 'Earth', 'Mars'] },
      { clues: ['The rocket launches first', 'Landing is last', 'Orbit is before re-entry'], items: ['Launch', 'Orbit', 'Re-entry', 'Landing'] },
      { clues: ['The sun is biggest', 'Earth is bigger than Moon', 'The star is far away'], items: ['Moon', 'Earth', 'Star', 'Sun'] }
    ],
    memoryItems: ['Rocket', 'Moon', 'Star', 'Planet', 'Sun', 'Comet', 'Satellite', 'Astronaut', 'Alien', 'UFO'],
    wordSearchWords: ['STAR', 'MOON', 'SUN', 'MARS', 'ORBIT', 'SPACE', 'ROCKET', 'PLANET', 'COMET', 'ALIEN'],
    mazeTheme: { start: 'ROCKET', end: 'MOON', instruction: 'Help the rocket reach the moon!' },
    visualContext: 'space objects'
  },
  nature: {
    riddles: [
      { riddle: "I have leaves but I'm not a book. Birds live in me. What am I?", answer: 'Tree' },
      { riddle: "I'm colorful and attract bees. I smell nice. What am I?", answer: 'Flower' },
      { riddle: "I fall from clouds but I'm not a bird. What am I?", answer: 'Rain' },
      { riddle: "I'm white and fluffy in the sky. What am I?", answer: 'Cloud' },
      { riddle: "I have colors after the rain. What am I?", answer: 'Rainbow' },
      { riddle: "I'm tall and made of rock. Climbers scale me. What am I?", answer: 'Mountain' },
      { riddle: "I flow to the sea but never stop. What am I?", answer: 'River' },
      { riddle: "I'm hot and bright, I rise each morning. What am I?", answer: 'Sun' },
      { riddle: "I fall from trees in autumn. What am I?", answer: 'Leaf' },
      { riddle: "I'm cold and white, I fall in winter. What am I?", answer: 'Snow' }
    ],
    logicPuzzles: [
      { clues: ['Spring comes before summer', 'Winter is coldest', 'Fall is after summer'], items: ['Spring', 'Summer', 'Fall', 'Winter'] },
      { clues: ['The seed is planted first', 'The flower blooms last', 'The stem grows before leaves'], items: ['Seed', 'Stem', 'Leaves', 'Flower'] },
      { clues: ['Rain falls from clouds', 'Rivers flow to ocean', 'Sun makes clouds'], items: ['Sun', 'Cloud', 'Rain', 'River'] }
    ],
    memoryItems: ['Tree', 'Flower', 'Sun', 'Cloud', 'Rain', 'Mountain', 'River', 'Leaf', 'Rainbow', 'Butterfly'],
    wordSearchWords: ['TREE', 'FLOWER', 'RAIN', 'SUN', 'CLOUD', 'RIVER', 'LEAF', 'BIRD', 'GRASS', 'SKY'],
    mazeTheme: { start: 'SEED', end: 'FLOWER', instruction: 'Help the seed grow into a flower!' },
    visualContext: 'nature items'
  },
  vehicles: {
    riddles: [
      { riddle: "I have four wheels and take you places. What am I?", answer: 'Car' },
      { riddle: "I fly in the sky with wings but I'm not a bird. What am I?", answer: 'Airplane' },
      { riddle: "I ride on tracks and say choo-choo. What am I?", answer: 'Train' },
      { riddle: "I float on water and have a captain. What am I?", answer: 'Boat/Ship' },
      { riddle: "I have two wheels and you pedal me. What am I?", answer: 'Bicycle' },
      { riddle: "I'm big and yellow, I take kids to school. What am I?", answer: 'School bus' },
      { riddle: "I have blades on top and can hover. What am I?", answer: 'Helicopter' },
      { riddle: "I'm red and have a siren. I fight fires. What am I?", answer: 'Fire truck' },
      { riddle: "I go underground in the city. What am I?", answer: 'Subway/Metro' },
      { riddle: "I'm very fast and race on tracks. What am I?", answer: 'Race car' }
    ],
    logicPuzzles: [
      { clues: ['The car has four wheels', 'The bike is before the bus', 'The train is longest'], items: ['Bike', 'Car', 'Bus', 'Train'] },
      { clues: ['The plane flies highest', 'The boat is on water', 'The helicopter hovers'], items: ['Boat', 'Car', 'Helicopter', 'Plane'] },
      { clues: ['The ambulance is fastest', 'The truck carries cargo', 'The taxi is yellow'], items: ['Taxi', 'Truck', 'Bus', 'Ambulance'] }
    ],
    memoryItems: ['Car', 'Bus', 'Plane', 'Train', 'Boat', 'Bike', 'Truck', 'Helicopter', 'Rocket', 'Submarine'],
    wordSearchWords: ['CAR', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'BIKE', 'TRUCK', 'TAXI', 'DRIVE', 'WHEEL'],
    mazeTheme: { start: 'START', end: 'FINISH', instruction: 'Help the race car reach the finish line!' },
    visualContext: 'vehicles'
  },
  dinosaurs: {
    riddles: [
      { riddle: "I'm the king of dinosaurs with tiny arms. What am I?", answer: 'T-Rex' },
      { riddle: "I have three horns on my head. What am I?", answer: 'Triceratops' },
      { riddle: "I have a long neck to reach tall trees. What am I?", answer: 'Brachiosaurus' },
      { riddle: "I have plates on my back and spikes on my tail. What am I?", answer: 'Stegosaurus' },
      { riddle: "I fly in the sky but I'm not a bird. I lived with dinosaurs. What am I?", answer: 'Pterodactyl' },
      { riddle: "I'm fast and hunt in packs. What am I?", answer: 'Velociraptor' },
      { riddle: "I have a hard head for head-butting. What am I?", answer: 'Pachycephalosaurus' },
      { riddle: "I swim in the ocean and have flippers. What am I?", answer: 'Plesiosaur' },
      { riddle: "I'm covered in armor like a tank. What am I?", answer: 'Ankylosaurus' },
      { riddle: "Scientists dig up my bones. What am I?", answer: 'Fossil' }
    ],
    logicPuzzles: [
      { clues: ['T-Rex is the biggest carnivore', 'Triceratops has horns', 'Pterodactyl can fly'], items: ['Pterodactyl', 'Velociraptor', 'Triceratops', 'T-Rex'] },
      { clues: ['The egg comes first', 'The adult is last', 'The baby hatches from egg'], items: ['Egg', 'Baby', 'Young', 'Adult'] },
      { clues: ['Herbivores eat plants', 'Carnivores eat meat', 'T-Rex is not herbivore'], items: ['Plants', 'Herbivore', 'Carnivore', 'T-Rex'] }
    ],
    memoryItems: ['T-Rex', 'Triceratops', 'Stegosaurus', 'Pterodactyl', 'Velociraptor', 'Brachiosaurus', 'Fossil', 'Egg', 'Bone', 'Footprint'],
    wordSearchWords: ['TREX', 'DINO', 'FOSSIL', 'BONE', 'ROAR', 'CLAW', 'TAIL', 'HORN', 'GIANT', 'EGG'],
    mazeTheme: { start: 'EXPLORER', end: 'FOSSIL', instruction: 'Help the explorer find the dinosaur fossil!' },
    visualContext: 'dinosaurs'
  },
  default: {
    riddles: [
      { riddle: "I have hands but can't clap. What am I?", answer: 'A clock' },
      { riddle: "What has ears but cannot hear?", answer: 'Corn' },
      { riddle: "What gets wetter the more it dries?", answer: 'A towel' },
      { riddle: "What has a head and a tail but no body?", answer: 'A coin' },
      { riddle: "What can you catch but not throw?", answer: 'A cold' }
    ],
    logicPuzzles: [
      { clues: ['Red is not first', 'Blue comes before green', 'Yellow is last'], items: ['Red', 'Blue', 'Green', 'Yellow'] },
      { clues: ['Circle is before square', 'Triangle is not last', 'Star is after triangle'], items: ['Circle', 'Square', 'Triangle', 'Star'] }
    ],
    memoryItems: ['Star', 'Heart', 'Circle', 'Square', 'Triangle', 'Diamond', 'Moon', 'Sun', 'Flower', 'Tree'],
    wordSearchWords: ['FUN', 'PLAY', 'GAME', 'LEARN', 'THINK', 'DRAW', 'COLOR', 'READ', 'WRITE', 'COUNT'],
    mazeTheme: { start: 'START', end: 'FINISH', instruction: 'Find the way through the maze!' },
    visualContext: 'shapes and objects'
  },
  math: {
    riddles: [
      { riddle: "I am an odd number. Take away a letter and I become even. What am I?", answer: 'Seven (remove S = Even)' },
      { riddle: "If two's company and three's a crowd, what are four and five?", answer: 'Nine (4+5=9)' },
      { riddle: "What has a face and two hands but no arms or legs?", answer: 'A clock' },
      { riddle: "I add five to nine and get two. How is this possible?", answer: '2 PM (9AM + 5 hours)' },
      { riddle: "What three positive numbers give the same answer when multiplied and added together?", answer: '1, 2, 3 (1×2×3=6, 1+2+3=6)' },
      { riddle: "If there are 3 apples and you take away 2, how many do you have?", answer: '2 (you took 2)' },
      { riddle: "A farmer has 17 sheep. All but 9 run away. How many are left?", answer: '9' },
      { riddle: "What is half of 2 plus 2?", answer: '3 (half of 2 is 1, plus 2 = 3)' },
      { riddle: "How many times can you subtract 5 from 25?", answer: 'Once (then it becomes 20)' },
      { riddle: "If a dozen eggs costs 12 cents, how many eggs can you get for a cent?", answer: '12 eggs (a dozen)' }
    ],
    logicPuzzles: [
      { clues: ['1 is less than 2', '3 comes after 2', '4 is the largest'], items: ['1', '2', '3', '4'] },
      { clues: ['Addition comes before subtraction', 'Division is last', 'Multiplication is after subtraction'], items: ['Addition', 'Subtraction', 'Multiplication', 'Division'] },
      { clues: ['Triangle has 3 sides', 'Square has more than triangle', 'Pentagon has the most'], items: ['Triangle', 'Square', 'Rectangle', 'Pentagon'] }
    ],
    memoryItems: ['Plus', 'Minus', 'Times', 'Divide', 'Equals', 'One', 'Two', 'Three', 'Four', 'Five'],
    wordSearchWords: ['ADD', 'SUM', 'PLUS', 'MINUS', 'TIMES', 'EQUAL', 'NUMBER', 'COUNT', 'MATH', 'TEN'],
    mazeTheme: { start: '1', end: '100', instruction: 'Help count from 1 to 100 through the maze!' },
    visualContext: 'numbers and shapes'
  },
  school: {
    riddles: [
      { riddle: "I have a spine but no bones. I have pages but I'm not a website. What am I?", answer: 'A book' },
      { riddle: "I am full of keys but cannot open any door. What am I?", answer: 'A keyboard' },
      { riddle: "I get sharper the more I'm used. What am I?", answer: 'Your brain/mind' },
      { riddle: "You can write on me, erase me, and I hang on a wall. What am I?", answer: 'A whiteboard/chalkboard' },
      { riddle: "I have 26 brothers and we make words together. What am I?", answer: 'A letter of the alphabet' },
      { riddle: "The more you take away from me, the bigger I get. What am I?", answer: 'A hole' },
      { riddle: "I'm tall when I'm young and short when I'm old. What am I?", answer: 'A pencil/candle' },
      { riddle: "What has words but never speaks?", answer: 'A book' },
      { riddle: "What can you hold without touching it?", answer: 'A conversation' },
      { riddle: "I go in hard and come out soft. What am I?", answer: 'Gum/knowledge' }
    ],
    logicPuzzles: [
      { clues: ['Math is before Science', 'English is after lunch', 'Art is last'], items: ['Math', 'Science', 'English', 'Art'] },
      { clues: ['Kindergarten is first', 'High school is after middle school', 'College is last'], items: ['Kindergarten', 'Elementary', 'Middle School', 'High School'] },
      { clues: ['Reading comes before writing', 'Counting is after writing', 'Drawing is last'], items: ['Reading', 'Writing', 'Counting', 'Drawing'] }
    ],
    memoryItems: ['Book', 'Pencil', 'Ruler', 'Eraser', 'Paper', 'Crayon', 'Scissors', 'Glue', 'Backpack', 'Notebook'],
    wordSearchWords: ['BOOK', 'READ', 'WRITE', 'LEARN', 'STUDY', 'CLASS', 'TEST', 'GRADE', 'SCHOOL', 'TEACH'],
    mazeTheme: { start: 'HOME', end: 'SCHOOL', instruction: 'Help the student get to school!' },
    visualContext: 'school supplies'
  }
}

// Helper to get themed content
function getThemedContent(theme) {
  // Map common theme names to our content keys
  const themeMap = {
    'sports': 'sports',
    'food': 'food', 
    'animals': 'animals',
    'ocean': 'ocean',
    'sea': 'ocean',
    'space': 'space',
    'nature': 'nature',
    'vehicles': 'vehicles',
    'transportation': 'vehicles',
    'dinosaurs': 'dinosaurs',
    'dino': 'dinosaurs',
    'math': 'math',
    'mathematics': 'math',
    'numbers': 'math',
    'counting': 'math',
    'school': 'school',
    'education': 'school',
    'learning': 'school',
    'classroom': 'school'
  }
  
  const normalizedTheme = theme?.toLowerCase() || ''
  
  // Try to find a matching theme
  for (const [key, value] of Object.entries(themeMap)) {
    if (normalizedTheme.includes(key)) {
      return THEMED_CONTENT[value]
    }
  }
  
  // For custom themes, return default but mark it for AI generation
  return { ...THEMED_CONTENT.default, customTheme: theme, needsAIGeneration: true }
}

// Cache for AI-generated content to avoid regenerating for same theme
const aiContentCache = new Map()

// Generate AI-powered content for custom themes
async function generateAIThemedContent(theme) {
  // Check cache first
  if (aiContentCache.has(theme?.toLowerCase())) {
    return aiContentCache.get(theme.toLowerCase())
  }
  
  console.log(`Generating AI content for custom theme: ${theme}`)
  
  try {
    const prompt = `Generate activity book content for the theme "${theme}". Return ONLY a valid JSON object with this exact structure, no markdown or extra text:
{
  "riddles": [
    {"riddle": "A riddle about ${theme}", "answer": "The answer"},
    {"riddle": "Another riddle about ${theme}", "answer": "The answer"},
    {"riddle": "Third riddle about ${theme}", "answer": "The answer"},
    {"riddle": "Fourth riddle about ${theme}", "answer": "The answer"},
    {"riddle": "Fifth riddle about ${theme}", "answer": "The answer"}
  ],
  "triviaQuestions": [
    {"q": "Question about ${theme}?", "a": "Answer", "options": ["Wrong1", "Answer", "Wrong2"]},
    {"q": "Another question?", "a": "Answer", "options": ["Wrong1", "Answer", "Wrong2"]},
    {"q": "Third question?", "a": "Answer", "options": ["Wrong1", "Answer", "Wrong2"]}
  ],
  "wordSearchWords": ["WORD1", "WORD2", "WORD3", "WORD4", "WORD5", "WORD6", "WORD7", "WORD8"],
  "memoryItems": ["Item1", "Item2", "Item3", "Item4", "Item5", "Item6", "Item7", "Item8"],
  "mazeStart": "START_LABEL",
  "mazeEnd": "END_LABEL",
  "mazeInstruction": "Help find the way through the ${theme} maze!",
  "wouldYouRather": [
    "Would you rather question 1 about ${theme}?",
    "Would you rather question 2 about ${theme}?",
    "Would you rather question 3 about ${theme}?"
  ],
  "hangmanWords": ["WORD1", "WORD2", "WORD3", "WORD4", "WORD5", "WORD6"],
  "drawingPrompts": [
    "Draw a ${theme} character or creature",
    "Draw a magical ${theme} scene",
    "Draw yourself in a ${theme} adventure",
    "Draw your dream ${theme} world",
    "Draw a ${theme} creature with special powers"
  ],
  "doodlePrompts": [
    "Complete the ${theme} character's outfit",
    "Add magical details to this ${theme} creature",
    "Finish drawing the ${theme} castle or building",
    "Add wings, scales, or other features to this ${theme} being"
  ],
  "colorByNumberColors": {
    "1": "Purple (Magic)",
    "2": "Blue (Sky/Water)",
    "3": "Gold (Treasure)",
    "4": "Green (Forest)",
    "5": "Silver (Armor)",
    "6": "Pink (Sparkles)"
  },
  "colorByNumberPicture": "A ${theme} themed picture",
  "connectColorPictures": ["unicorn", "dragon", "castle", "wizard hat", "magic wand"],
  "matchingPairs": [
    ["Left1", "Right1"],
    ["Left2", "Right2"],
    ["Left3", "Right3"],
    ["Left4", "Right4"]
  ],
  "spellingWords": ["WORD1", "WORD2", "WORD3", "WORD4", "WORD5", "WORD6"],
  "tracingWords": ["WORD1", "WORD2", "WORD3", "WORD4"]
}

Make all content appropriate for children, educational, fun, and specifically related to "${theme}". For drawing prompts and doodle prompts, make them creative and imaginative. For color-by-number, suggest colors that match the ${theme} theme.`

    const result = await runLLM(prompt, 'You are a creative children\'s activity book content generator. Generate fun, educational, age-appropriate content. Return ONLY valid JSON, no markdown formatting.')
    
    console.log('LLM Result:', JSON.stringify(result).substring(0, 500))
    
    if (result && result.success && result.content) {
      // Clean up the result - remove markdown code blocks if present
      let cleanResult = result.content.trim()
      
      // Remove markdown code blocks
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }
      
      // Extract JSON object - find the first { and last } to handle extra text
      const firstBrace = cleanResult.indexOf('{')
      const lastBrace = cleanResult.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResult = cleanResult.substring(firstBrace, lastBrace + 1)
      }
      
      console.log('Cleaned AI response:', cleanResult.substring(0, 300))
      
      // Try to parse JSON, with fallback
      let aiContent
      try {
        aiContent = JSON.parse(cleanResult)
      } catch (parseError) {
        console.error('JSON parse error, trying to fix:', parseError.message)
        // Try to fix common JSON issues
        cleanResult = cleanResult
          .replace(/,\s*}/g, '}')  // Remove trailing commas before }
          .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
          .replace(/'/g, '"')      // Replace single quotes with double quotes
        aiContent = JSON.parse(cleanResult)
      }
      
      // Build themed content structure
      const generatedContent = {
        riddles: aiContent.riddles || THEMED_CONTENT.default.riddles,
        triviaQuestions: aiContent.triviaQuestions || [],
        logicPuzzles: THEMED_CONTENT.default.logicPuzzles, // Keep default logic puzzles
        memoryItems: aiContent.memoryItems || THEMED_CONTENT.default.memoryItems,
        wordSearchWords: (aiContent.wordSearchWords || THEMED_CONTENT.default.wordSearchWords).map(w => w.toUpperCase().replace(/[^A-Z]/g, '')),
        mazeTheme: {
          start: aiContent.mazeStart || 'START',
          end: aiContent.mazeEnd || 'FINISH',
          instruction: aiContent.mazeInstruction || `Find your way through the ${theme} maze!`
        },
        wouldYouRather: aiContent.wouldYouRather || [],
        hangmanWords: (aiContent.hangmanWords || []).map(w => w.toUpperCase()),
        drawingPrompts: aiContent.drawingPrompts || [],
        doodlePrompts: aiContent.doodlePrompts || [],
        colorByNumberColors: aiContent.colorByNumberColors || null,
        colorByNumberPicture: aiContent.colorByNumberPicture || null,
        connectColorPictures: aiContent.connectColorPictures || [],
        matchingPairs: aiContent.matchingPairs || [],
        spellingWords: (aiContent.spellingWords || []).map(w => w.toUpperCase()),
        tracingWords: aiContent.tracingWords || [],
        visualContext: theme,
        customTheme: theme,
        isAIGenerated: true
      }
      
      // Cache the result
      aiContentCache.set(theme.toLowerCase(), generatedContent)
      console.log(`AI content generated and cached for theme: ${theme}`)
      
      return generatedContent
    }
  } catch (error) {
    console.error(`Error generating AI content for theme ${theme}:`, error)
  }
  
  // Fallback to default with theme name
  return { ...THEMED_CONTENT.default, customTheme: theme, visualContext: theme }
}

async function generateLogicPuzzle(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const puzzles = themedContent.logicPuzzles
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)]
  
  return {
    type: 'logic-puzzle',
    puzzle,
    theme,
    instructions: 'Use the clues to figure out the correct order!'
  }
}

async function generateRiddles(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const allRiddles = themedContent.riddles
  
  // Shuffle and pick riddles based on difficulty
  const shuffled = [...allRiddles].sort(() => Math.random() - 0.5)
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
  const selectedRiddles = shuffled.slice(0, Math.min(count, shuffled.length))
  
  return {
    type: 'riddles',
    riddles: selectedRiddles,
    theme,
    instructions: `Can you solve these ${theme || 'brain-teasing'} riddles?`
  }
}

async function generateComplexMaze(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const mazeTheme = themedContent.mazeTheme || { start: 'START', end: 'FINISH', instruction: `Navigate the ${theme} maze!` }
  const mazeId = Math.floor(Math.random() * 1000)
  const sizes = { easy: 15, medium: 25, hard: 35 }
  
  return {
    type: 'maze-complex',
    size: sizes[difficulty] || 25,
    mazeId,
    multiPath: difficulty === 'hard',
    seed: Date.now() + Math.random(),
    startLabel: mazeTheme.start,
    endLabel: mazeTheme.end,
    theme,
    instructions: mazeTheme.instruction
  }
}

async function generateMemoryGame(theme, difficulty, ageGroup) {
  let themedContent = getThemedContent(theme)
  
  // Generate AI content for custom themes
  if (themedContent.needsAIGeneration && theme) {
    themedContent = await generateAIThemedContent(theme)
  }
  
  const items = [...themedContent.memoryItems]
  const pairCount = difficulty === 'easy' ? 6 : difficulty === 'hard' ? 10 : 8
  
  // Shuffle and select items
  const shuffledItems = items.sort(() => Math.random() - 0.5).slice(0, pairCount)
  
  return {
    type: 'memory',
    pairs: pairCount,
    items: shuffledItems,
    theme,
    instructions: `Match the ${theme || ''} pairs! Cut out and play memory match!`
  }
}

function generateSequences(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  // Generate varied number sequences with themed context
  const sequenceGenerators = [
    () => { const s = Math.floor(Math.random() * 5) + 1; return { pattern: [s, s+2, s+4, s+6, '?'], answer: s+8, hint: 'Add 2' } },
    () => { const s = Math.floor(Math.random() * 5) + 1; return { pattern: [s, s+3, s+6, s+9, '?'], answer: s+12, hint: 'Add 3' } },
    () => { const s = Math.floor(Math.random() * 3) * 5; return { pattern: [s, s+5, s+10, s+15, '?'], answer: s+20, hint: 'Add 5' } },
    () => { const s = Math.floor(Math.random() * 3) + 1; return { pattern: [s, s*2, s*4, s*8, '?'], answer: s*16, hint: 'Multiply by 2' } },
    () => { return { pattern: [1, 1, 2, 3, '?'], answer: 5, hint: 'Fibonacci' } },
    () => { return { pattern: [1, 4, 9, 16, '?'], answer: 25, hint: 'Square numbers' } }
  ]
  
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4
  const sequences = []
  const usedGenerators = new Set()
  
  while (sequences.length < count && usedGenerators.size < sequenceGenerators.length) {
    const idx = Math.floor(Math.random() * sequenceGenerators.length)
    if (!usedGenerators.has(idx)) {
      usedGenerators.add(idx)
      sequences.push(sequenceGenerators[idx]())
    }
  }
  
  return {
    type: 'sequences',
    sequences,
    theme,
    instructions: `Find the pattern and fill in the missing number!`
  }
}

function generateVisualPuzzles(theme, difficulty, ageGroup) {
  const themedContent = getThemedContent(theme)
  
  const puzzleTypes = [
    `Which ${themedContent.visualContext} doesn't belong?`,
    'How many triangles can you count?',
    'What comes next in the pattern?',
    `Find the matching ${themedContent.visualContext}`,
    'Which is the mirror image?',
    'Complete the pattern',
    'Find the odd one out',
    'Which shadow matches?'
  ]
  
  const shuffled = puzzleTypes.sort(() => Math.random() - 0.5)
  const count = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3
  
  return {
    type: 'visual-puzzles',
    puzzles: shuffled.slice(0, count),
    puzzleCount: count,
    seed: Date.now() + Math.random() * 10000,
    theme,
    instructions: `Look carefully to solve these ${theme || ''} visual puzzles!`
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
  // Remove all non-ASCII characters except common punctuation and letters
  // This catches all emojis and special Unicode symbols
  return text.replace(/[^\x20-\x7E]/g, '').trim()
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
  try {
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
    
    console.log(`Received selectedActivities: ${JSON.stringify(selectedActivities)}`)
    
    // Filter out special markers like '__none__' and ensure we have valid activities
    let activities = selectedActivities && selectedActivities.length > 0 
      ? selectedActivities.filter(a => a !== '__none__' && ACTIVITY_GENERATORS[a])
      : []
    
    // If no valid activities after filtering, fall back to all generators
    if (activities.length === 0) {
      console.log('No valid activities found, falling back to all generators')
      activities = Object.keys(ACTIVITY_GENERATORS)
    }
    
    console.log(`Generating ${pageCount} activity pages for ${themeToUse} theme, age group: ${ageGroup}`)
    console.log(`Using activities: ${activities.join(', ')}`)
    
    const pages = []
    
    // Distribute activities across pages
    for (let i = 0; i < pageCount; i++) {
      const activityId = activities[i % activities.length]
      const generator = ACTIVITY_GENERATORS[activityId]
      
      if (generator) {
        const difficulty = i < pageCount / 3 ? 'easy' : i < (pageCount * 2) / 3 ? 'medium' : 'hard'
        // Use await since some generators are async (AI-powered)
        const content = await generator(themeToUse, difficulty, ageGroup)
        
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
  } catch (error) {
    console.error('Error generating activity pages:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate activity pages'
    }, { status: 500 })
  }
}

// Get creative activity title
function getActivityTitle(activityId, theme, pageNum) {
  const cleanTheme = theme ? theme.charAt(0).toUpperCase() + theme.slice(1).toLowerCase() : ''
  
  const titles = {
    'word-search': `${cleanTheme} Word Search #${Math.ceil(pageNum / 3)}`,
    'crossword': `${cleanTheme} Crossword Puzzle`,
    'sudoku': `${cleanTheme} Sudoku Challenge`,
    'maze': `${cleanTheme} Adventure Maze`,
    'spot-difference': `${cleanTheme} Spot the Differences`,
    'connect-dots': `${cleanTheme} Connect the Dots`,
    'math': `${cleanTheme} Math Challenge`,
    'spelling': `${cleanTheme} Spelling Fun`,
    'tracing': `${cleanTheme} Word Tracing`,
    'matching': `${cleanTheme} Match It Up!`,
    'counting': `${cleanTheme} Counting Activity`,
    'patterns': `${cleanTheme} Pattern Detective`,
    'would-you-rather': `${cleanTheme} Would You Rather?`,
    'trivia': `${cleanTheme} Trivia Time`,
    'tic-tac-toe': `Tic-Tac-Toe Games`,
    'hangman': `${cleanTheme} Guess the Word`,
    'bingo': `${cleanTheme} Bingo`,
    'travel-games': `${cleanTheme} Travel Fun`,
    'color-by-number': `${cleanTheme} Color By Number`,
    'doodle-complete': `${cleanTheme} Complete the Doodle`,
    'drawing-prompts': `${cleanTheme} Draw It!`,
    'connect-color': `${cleanTheme} Connect & Color`,
    'logic-puzzle': `${cleanTheme} Logic Challenge`,
    'riddles': `${cleanTheme} Riddle Me This!`,
    'maze-complex': `${cleanTheme} Super Maze`,
    'memory': `${cleanTheme} Memory Match`,
    'sequences': `${cleanTheme} Number Sequences`,
    'visual-puzzles': `${cleanTheme} Visual Puzzles`
  }
  
  return titles[activityId] || `${cleanTheme} Activity ${pageNum}`
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
    console.log(`Drawing page ${i + 1}: title="${pageData.title}", activityType="${pageData.activityType}", contentType="${pageData.content?.type}"`)
    
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
    const leftMargin = 50
    const columnWidth = (pageWidth - 100) / 2
    let currentColumn = 0
    let columnStartY = answerY
    
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i]
      const content = pageData.content || {}
      const pageNum = i + 2 // Page 1 is cover
      
      // Check if we need a new page
      if (answerY < 100) {
        if (currentColumn === 0) {
          // Move to second column
          currentColumn = 1
          answerY = columnStartY
        } else {
          // Add new page
          page = pdfDoc.addPage([pageWidth, pageHeight])
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.98, 0.98, 0.98) })
          page.drawText('ANSWER KEY (continued)', { x: pageWidth / 2 - 80, y: pageHeight - 60, size: 20, font: boldFont, color: pColor })
          answerY = pageHeight - 100
          columnStartY = answerY
          currentColumn = 0
        }
      }
      
      const colX = leftMargin + currentColumn * columnWidth
      
      // Draw answers based on activity type
      if (content.type === 'riddles' && content.riddles) {
        page.drawText(`Page ${pageNum}: Riddles`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        content.riddles.forEach((r, idx) => {
          if (answerY > 80) {
            const answerText = `${idx + 1}. ${r.answer || 'N/A'}`
            page.drawText(answerText.substring(0, 40), { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 12
          }
        })
        answerY -= 8
      }
      
      else if (content.type === 'word-search' && content.words) {
        page.drawText(`Page ${pageNum}: Word Search`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        const wordsText = content.words.join(', ')
        // Split long word list into multiple lines
        const maxChars = 45
        for (let c = 0; c < wordsText.length && answerY > 80; c += maxChars) {
          page.drawText(wordsText.substring(c, c + maxChars), { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
          answerY -= 11
        }
        answerY -= 8
      }
      
      else if (content.type === 'sequences' && content.sequences) {
        page.drawText(`Page ${pageNum}: Number Sequences`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        content.sequences.forEach((s, idx) => {
          if (answerY > 80) {
            page.drawText(`${idx + 1}. Answer: ${s.answer}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 12
          }
        })
        answerY -= 8
      }
      
      else if (content.type === 'logic-puzzle' && content.puzzle) {
        page.drawText(`Page ${pageNum}: Logic Puzzle`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        const items = content.puzzle.items || []
        page.drawText(`Order: ${items.join(' → ')}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 20
      }
      
      else if (content.type === 'crossword' && content.clues) {
        page.drawText(`Page ${pageNum}: Crossword`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        const across = content.clues.across || []
        const down = content.clues.down || []
        across.forEach(clue => {
          if (answerY > 80) {
            page.drawText(`${clue.number} Across: ${clue.answer}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 11
          }
        })
        down.forEach(clue => {
          if (answerY > 80) {
            page.drawText(`${clue.number} Down: ${clue.answer}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 11
          }
        })
        answerY -= 8
      }
      
      else if (content.type === 'math' && content.problems) {
        page.drawText(`Page ${pageNum}: Math Problems`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        content.problems.forEach((p, idx) => {
          if (answerY > 80) {
            page.drawText(`${idx + 1}. ${p.problem} = ${p.answer}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 11
          }
        })
        answerY -= 8
      }
      
      else if (content.type === 'trivia' && content.questions) {
        page.drawText(`Page ${pageNum}: Trivia`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        content.questions.forEach((q, idx) => {
          if (answerY > 80) {
            page.drawText(`${idx + 1}. ${q.answer || q.correct || 'N/A'}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
            answerY -= 11
          }
        })
        answerY -= 8
      }
      
      else if (content.type === 'sudoku') {
        page.drawText(`Page ${pageNum}: Sudoku - Solution available separately`, { x: colX, y: answerY, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
        answerY -= 18
      }
      
      else if (content.type === 'spot-difference') {
        page.drawText(`Page ${pageNum}: Spot the Differences`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        page.drawText('1. Window shape (square vs round)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('2. Chimney (present vs missing)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('3. Sun size (larger vs smaller)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('4. Tree height (taller vs shorter)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('5. Flowers (3 vs 2)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('6. Bird (present vs missing)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('7. Clouds (1 vs 2)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 11
        page.drawText('8. Fence posts (4 vs 3)', { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 18
      }
      
      else if (content.type === 'maze' || content.type === 'maze-complex') {
        page.drawText(`Page ${pageNum}: Maze - Find path from ${content.startLabel || 'START'} to ${content.endLabel || 'FINISH'}`, { x: colX, y: answerY, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
        answerY -= 18
      }
      
      else if (content.type === 'memory') {
        page.drawText(`Page ${pageNum}: Memory Match`, { x: colX, y: answerY, size: 10, font: boldFont, color: pColor })
        answerY -= 14
        const items = content.items || []
        page.drawText(`Pairs: ${items.join(', ')}`, { x: colX + 10, y: answerY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        answerY -= 18
      }
      
      else if (content.type === 'visual-puzzles') {
        page.drawText(`Page ${pageNum}: Visual Puzzles - Answers vary`, { x: colX, y: answerY, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
        answerY -= 18
      }
      
      else if (content.type === 'connect-dots' || content.type === 'drawing-prompts' || content.type === 'coloring') {
        // Skip creative activities
      }
    }
    
    // Footer note
    if (answerY > 60) {
      page.drawText('Note: Creative activities like coloring, drawing, and connect-the-dots have no fixed answers.', {
        x: leftMargin,
        y: 40,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
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
      const clues = content.clues || { across: [], down: [] }
      
      // Reserve space for clues at bottom
      const clueAreaHeight = 100
      const availableGridHeight = height - clueAreaHeight - 20
      
      const cwCellSize = Math.min(width - 40, availableGridHeight) / cwGridSize
      const cwStartX = centerX - (cwGridSize * cwCellSize) / 2
      const cwStartY = y + height - 10 // Start from top of content area
      
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
      
      // Position clues below grid
      const gridBottom = cwStartY - (cwGridSize * cwCellSize)
      let clueY = gridBottom - 15
      
      // Draw clues in two columns (Across on left, Down on right)
      const clueColWidth = (width - 40) / 2
      
      // ACROSS clues on left
      page.drawText('ACROSS:', { x: x + 15, y: clueY, size: 9, font: boldFont, color: pColor })
      let acrossY = clueY - 14
      ;(clues.across || []).slice(0, 5).forEach((clue) => {
        if (acrossY >= y + 10) {
          const clueText = `${clue.number}. ${stripEmojis(clue.clue)}`.substring(0, 35)
          page.drawText(clueText, { x: x + 15, y: acrossY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
          acrossY -= 12
        }
      })
      
      // DOWN clues on right
      page.drawText('DOWN:', { x: x + clueColWidth + 15, y: clueY, size: 9, font: boldFont, color: pColor })
      let downY = clueY - 14
      ;(clues.down || []).slice(0, 5).forEach((clue) => {
        if (downY >= y + 10) {
          const clueText = `${clue.number}. ${stripEmojis(clue.clue)}`.substring(0, 35)
          page.drawText(clueText, { x: x + clueColWidth + 15, y: downY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
          downY -= 12
        }
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
      // Create maze area with proper margins for START/FINISH labels
      const mazeMargin = 30
      const mazeHeight = height - 70 // Leave room for labels
      const mazeWidth = width - mazeMargin * 2
      const mazeY = y + 40
      
      // Use themed labels if available
      const startLabel = content.startLabel || 'START'
      const endLabel = content.endLabel || 'FINISH'
      
      // Use seed for reproducible but unique maze
      const mazeSeed = content.seed || Date.now()
      const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      page.drawRectangle({ 
        x: x + mazeMargin, 
        y: mazeY, 
        width: mazeWidth, 
        height: mazeHeight, 
        borderColor: rgb(0.4, 0.4, 0.4), 
        borderWidth: 2 
      })
      
      // Position labels inside the maze bounds with themed text
      page.drawText(startLabel, { x: x + mazeMargin + 10, y: mazeY + mazeHeight - 20, size: 9, font: boldFont, color: rgb(0.2, 0.7, 0.2) })
      page.drawText(endLabel, { x: x + mazeMargin + mazeWidth - 55, y: mazeY + 10, size: 9, font: boldFont, color: rgb(0.7, 0.2, 0.2) })
      
      // Draw more complex maze structure
      const mazeLines = content.type === 'maze-complex' ? 14 : 10
      const lineSpacing = (mazeHeight - 60) / mazeLines
      
      // Generate horizontal lines with gaps
      for (let i = 0; i < mazeLines; i++) {
        const lineY = mazeY + 30 + i * lineSpacing
        const numSegments = 2 + Math.floor(seededRandom(mazeSeed + i * 100) * 3) // 2-4 segments
        const segmentWidth = (mazeWidth - 40) / numSegments
        
        for (let s = 0; s < numSegments; s++) {
          // Create gaps in some segments
          if (seededRandom(mazeSeed + i * 100 + s) > 0.3) {
            const segStartX = x + mazeMargin + 20 + s * segmentWidth
            const gapPos = seededRandom(mazeSeed + i * 200 + s) * segmentWidth * 0.6
            const gapWidth = 25 + seededRandom(mazeSeed + i * 300 + s) * 20
            
            // Line before gap
            if (gapPos > 10) {
              page.drawLine({ 
                start: { x: segStartX, y: lineY }, 
                end: { x: segStartX + gapPos, y: lineY }, 
                thickness: 2, 
                color: rgb(0.3, 0.3, 0.3) 
              })
            }
            // Line after gap
            if (gapPos + gapWidth < segmentWidth - 10) {
              page.drawLine({ 
                start: { x: segStartX + gapPos + gapWidth, y: lineY }, 
                end: { x: segStartX + segmentWidth - 5, y: lineY }, 
                thickness: 2, 
                color: rgb(0.3, 0.3, 0.3) 
              })
            }
          }
        }
        
        // Vertical connectors with randomized positions
        if (i > 0) {
          const numVerticals = 2 + Math.floor(seededRandom(mazeSeed + i * 500) * 3)
          for (let v = 0; v < numVerticals; v++) {
            if (seededRandom(mazeSeed + i * 600 + v) > 0.4) {
              const vx = x + mazeMargin + 30 + seededRandom(mazeSeed + i * 700 + v) * (mazeWidth - 60)
              const prevLineY = mazeY + 30 + (i - 1) * lineSpacing
              page.drawLine({ 
                start: { x: vx, y: prevLineY }, 
                end: { x: vx, y: lineY }, 
                thickness: 2, 
                color: rgb(0.3, 0.3, 0.3) 
              })
            }
          }
        }
      }
      
      // Add some dead ends
      for (let d = 0; d < 5; d++) {
        const deadEndX = x + mazeMargin + 40 + seededRandom(mazeSeed + d * 900) * (mazeWidth - 80)
        const deadEndY = mazeY + 50 + seededRandom(mazeSeed + d * 1000) * (mazeHeight - 100)
        const length = 20 + seededRandom(mazeSeed + d * 1100) * 30
        
        if (seededRandom(mazeSeed + d * 1200) > 0.5) {
          // Horizontal dead end
          page.drawLine({ 
            start: { x: deadEndX, y: deadEndY }, 
            end: { x: deadEndX + length, y: deadEndY }, 
            thickness: 2, 
            color: rgb(0.3, 0.3, 0.3) 
          })
        } else {
          // Vertical dead end
          page.drawLine({ 
            start: { x: deadEndX, y: deadEndY }, 
            end: { x: deadEndX, y: deadEndY + length }, 
            thickness: 2, 
            color: rgb(0.3, 0.3, 0.3) 
          })
        }
      }
      break
      
    case 'spot-difference':
      // Draw two boxes side by side with actual pictures
      const boxW = (width - 30) / 2
      const boxHeight = height - 80
      const boxAX = x + 5
      const boxBX = x + boxW + 15
      const boxBaseY = y + 30
      
      // Draw boxes
      page.drawRectangle({ x: boxAX, y: boxBaseY, width: boxW, height: boxHeight, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 2 })
      page.drawRectangle({ x: boxBX, y: boxBaseY, width: boxW, height: boxHeight, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 2 })
      
      // Labels
      page.drawText('Picture A', { x: boxAX + boxW / 2 - 25, y: boxBaseY + boxHeight + 10, size: 11, font: boldFont, color: pColor })
      page.drawText('Picture B', { x: boxBX + boxW / 2 - 25, y: boxBaseY + boxHeight + 10, size: 11, font: boldFont, color: pColor })
      
      // Draw a house scene in both boxes with differences
      const houseY = boxBaseY + 60
      const houseW = 80
      const houseH = 60
      const houseAX = boxAX + 30
      const houseBX = boxBX + 30
      
      // House A - base
      page.drawRectangle({ x: houseAX, y: houseY, width: houseW, height: houseH, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      // House A - roof (triangle)
      page.drawLine({ start: { x: houseAX, y: houseY + houseH }, end: { x: houseAX + houseW / 2, y: houseY + houseH + 40 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
      page.drawLine({ start: { x: houseAX + houseW / 2, y: houseY + houseH + 40 }, end: { x: houseAX + houseW, y: houseY + houseH }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
      // House A - door
      page.drawRectangle({ x: houseAX + 30, y: houseY, width: 20, height: 35, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House A - window (left) - DIFFERENCE 1: Square window
      page.drawRectangle({ x: houseAX + 10, y: houseY + 35, width: 15, height: 15, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House A - window (right)
      page.drawRectangle({ x: houseAX + 55, y: houseY + 35, width: 15, height: 15, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House A - chimney - DIFFERENCE 2: Has chimney
      page.drawRectangle({ x: houseAX + 60, y: houseY + houseH + 15, width: 12, height: 25, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      
      // House A - sun - DIFFERENCE 3: Larger sun
      page.drawCircle({ x: houseAX + houseW + 35, y: houseY + houseH + 50, size: 18, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      // Sun rays
      for (let r = 0; r < 8; r++) {
        const angle = (r * Math.PI * 2) / 8
        const sx = houseAX + houseW + 35 + Math.cos(angle) * 22
        const sy = houseY + houseH + 50 + Math.sin(angle) * 22
        const ex = houseAX + houseW + 35 + Math.cos(angle) * 28
        const ey = houseY + houseH + 50 + Math.sin(angle) * 28
        page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      }
      
      // House A - tree - DIFFERENCE 4: Taller tree
      page.drawRectangle({ x: houseAX + houseW + 20, y: houseY, width: 10, height: 45, color: rgb(0.4, 0.3, 0.2) })
      page.drawCircle({ x: houseAX + houseW + 25, y: houseY + 55, size: 22, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      
      // House A - flowers - DIFFERENCE 5: 3 flowers
      for (let f = 0; f < 3; f++) {
        const fx = houseAX + 10 + f * 25
        page.drawLine({ start: { x: fx, y: houseY }, end: { x: fx, y: houseY - 15 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
        page.drawCircle({ x: fx, y: houseY - 18, size: 5, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      }
      
      // House A - bird - DIFFERENCE 6: Bird present
      page.drawLine({ start: { x: houseAX + 20, y: houseY + houseH + 60 }, end: { x: houseAX + 25, y: houseY + houseH + 65 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      page.drawLine({ start: { x: houseAX + 25, y: houseY + houseH + 65 }, end: { x: houseAX + 30, y: houseY + houseH + 60 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      
      // House A - cloud - DIFFERENCE 7: One cloud
      page.drawCircle({ x: houseAX + 5, y: houseY + houseH + 70, size: 10, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseAX + 15, y: houseY + houseH + 73, size: 12, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseAX + 27, y: houseY + houseH + 70, size: 10, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      
      // House A - fence posts - DIFFERENCE 8: 4 posts
      for (let fp = 0; fp < 4; fp++) {
        page.drawRectangle({ x: houseAX + houseW + 50 + fp * 12, y: houseY, width: 4, height: 25, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      }
      page.drawLine({ start: { x: houseAX + houseW + 50, y: houseY + 18 }, end: { x: houseAX + houseW + 90, y: houseY + 18 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      
      // ===== PICTURE B - WITH DIFFERENCES =====
      
      // House B - base (same)
      page.drawRectangle({ x: houseBX, y: houseY, width: houseW, height: houseH, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      // House B - roof (same)
      page.drawLine({ start: { x: houseBX, y: houseY + houseH }, end: { x: houseBX + houseW / 2, y: houseY + houseH + 40 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
      page.drawLine({ start: { x: houseBX + houseW / 2, y: houseY + houseH + 40 }, end: { x: houseBX + houseW, y: houseY + houseH }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
      // House B - door (same)
      page.drawRectangle({ x: houseBX + 30, y: houseY, width: 20, height: 35, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House B - window (left) - DIFFERENCE 1: Round window
      page.drawCircle({ x: houseBX + 17, y: houseY + 42, size: 8, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House B - window (right) (same)
      page.drawRectangle({ x: houseBX + 55, y: houseY + 35, width: 15, height: 15, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      // House B - NO chimney - DIFFERENCE 2
      
      // House B - sun - DIFFERENCE 3: Smaller sun
      page.drawCircle({ x: houseBX + houseW + 35, y: houseY + houseH + 50, size: 12, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      // Sun rays (fewer)
      for (let r = 0; r < 6; r++) {
        const angle = (r * Math.PI * 2) / 6
        const sx = houseBX + houseW + 35 + Math.cos(angle) * 15
        const sy = houseY + houseH + 50 + Math.sin(angle) * 15
        const ex = houseBX + houseW + 35 + Math.cos(angle) * 20
        const ey = houseY + houseH + 50 + Math.sin(angle) * 20
        page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      }
      
      // House B - tree - DIFFERENCE 4: Shorter tree
      page.drawRectangle({ x: houseBX + houseW + 20, y: houseY, width: 10, height: 30, color: rgb(0.4, 0.3, 0.2) })
      page.drawCircle({ x: houseBX + houseW + 25, y: houseY + 40, size: 18, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
      
      // House B - flowers - DIFFERENCE 5: 2 flowers
      for (let f = 0; f < 2; f++) {
        const fx = houseBX + 10 + f * 25
        page.drawLine({ start: { x: fx, y: houseY }, end: { x: fx, y: houseY - 15 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
        page.drawCircle({ x: fx, y: houseY - 18, size: 5, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      }
      
      // House B - NO bird - DIFFERENCE 6
      
      // House B - clouds - DIFFERENCE 7: Two clouds
      page.drawCircle({ x: houseBX + 5, y: houseY + houseH + 70, size: 10, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseBX + 15, y: houseY + houseH + 73, size: 12, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseBX + 27, y: houseY + houseH + 70, size: 10, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      // Second cloud
      page.drawCircle({ x: houseBX + 50, y: houseY + houseH + 65, size: 8, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseBX + 58, y: houseY + houseH + 68, size: 10, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawCircle({ x: houseBX + 68, y: houseY + houseH + 65, size: 8, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      
      // House B - fence posts - DIFFERENCE 8: 3 posts
      for (let fp = 0; fp < 3; fp++) {
        page.drawRectangle({ x: houseBX + houseW + 50 + fp * 12, y: houseY, width: 4, height: 25, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1 })
      }
      page.drawLine({ start: { x: houseBX + houseW + 50, y: houseY + 18 }, end: { x: houseBX + houseW + 78, y: houseY + 18 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
      
      // Instruction
      page.drawText(`Can you find all ${content.differences || 8} differences?`, { x: centerX - 70, y: y + 12, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
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
          // Handle both old format (string) and new format (object with item and count)
          let displayText = ''
          if (typeof item === 'object' && item.item) {
            // New format: draw the item name repeated
            displayText = `${item.item} `.repeat(item.count || 1).trim()
          } else {
            // Old format: just display the string (strip emojis)
            displayText = stripEmojis(String(item)) || 'Item'
          }
          
          page.drawText(`${idx + 1}. Count: ${displayText}`, { x: x + 30, y: countY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
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
      // Draw a meaningful color by number picture based on theme
      const colors = content.colors || { 1: 'Red', 2: 'Blue', 3: 'Green', 4: 'Yellow', 5: 'Orange', 6: 'Purple' }
      const pictureDesc = content.pictureDescription || `${content.theme || 'Fun'} picture`
      
      // Draw color key at the top
      let colorKeyY = y + height - 20
      page.drawText('Color Key:', { x: x + 20, y: colorKeyY, size: 10, font: boldFont, color: pColor })
      let keyX = x + 90
      Object.entries(colors).forEach(([num, colorName], idx) => {
        if (keyX < x + width - 100) {
          page.drawText(`${num}=${stripEmojis(String(colorName).split('(')[0].trim())}`, { 
            x: keyX, y: colorKeyY, size: 8, font, color: rgb(0.3, 0.3, 0.3) 
          })
          keyX += 75
        }
      })
      
      // Draw a themed picture to color - more complex shapes
      const picCenterX = centerX
      const picCenterY = centerY - 20
      
      // Draw a castle/house shape for Fantasy/generic themes
      // Main building
      page.drawRectangle({ x: picCenterX - 80, y: picCenterY - 100, width: 160, height: 120, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('1', { x: picCenterX - 5, y: picCenterY - 50, size: 16, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Tower left
      page.drawRectangle({ x: picCenterX - 110, y: picCenterY - 100, width: 40, height: 150, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('2', { x: picCenterX - 95, y: picCenterY - 20, size: 14, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Tower right
      page.drawRectangle({ x: picCenterX + 70, y: picCenterY - 100, width: 40, height: 150, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('2', { x: picCenterX + 85, y: picCenterY - 20, size: 14, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Roof/top triangle (using lines)
      page.drawLine({ start: { x: picCenterX - 110, y: picCenterY + 50 }, end: { x: picCenterX - 90, y: picCenterY + 90 }, thickness: 1.5, color: rgb(0.4, 0.4, 0.4) })
      page.drawLine({ start: { x: picCenterX - 90, y: picCenterY + 90 }, end: { x: picCenterX - 70, y: picCenterY + 50 }, thickness: 1.5, color: rgb(0.4, 0.4, 0.4) })
      page.drawText('3', { x: picCenterX - 95, y: picCenterY + 60, size: 12, font, color: rgb(0.5, 0.5, 0.5) })
      
      page.drawLine({ start: { x: picCenterX + 70, y: picCenterY + 50 }, end: { x: picCenterX + 90, y: picCenterY + 90 }, thickness: 1.5, color: rgb(0.4, 0.4, 0.4) })
      page.drawLine({ start: { x: picCenterX + 90, y: picCenterY + 90 }, end: { x: picCenterX + 110, y: picCenterY + 50 }, thickness: 1.5, color: rgb(0.4, 0.4, 0.4) })
      page.drawText('3', { x: picCenterX + 85, y: picCenterY + 60, size: 12, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Door
      page.drawRectangle({ x: picCenterX - 25, y: picCenterY - 100, width: 50, height: 70, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('4', { x: picCenterX - 5, y: picCenterY - 75, size: 14, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Windows
      page.drawRectangle({ x: picCenterX - 65, y: picCenterY - 20, width: 30, height: 30, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('5', { x: picCenterX - 55, y: picCenterY - 12, size: 12, font, color: rgb(0.5, 0.5, 0.5) })
      
      page.drawRectangle({ x: picCenterX + 35, y: picCenterY - 20, width: 30, height: 30, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('5', { x: picCenterX + 45, y: picCenterY - 12, size: 12, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Sun
      page.drawCircle({ x: picCenterX + 140, y: picCenterY + 80, size: 30, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawText('6', { x: picCenterX + 135, y: picCenterY + 75, size: 14, font, color: rgb(0.5, 0.5, 0.5) })
      
      // Sun rays
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4
        const startR = 35
        const endR = 50
        page.drawLine({
          start: { x: picCenterX + 140 + Math.cos(angle) * startR, y: picCenterY + 80 + Math.sin(angle) * startR },
          end: { x: picCenterX + 140 + Math.cos(angle) * endR, y: picCenterY + 80 + Math.sin(angle) * endR },
          thickness: 1.5, color: rgb(0.4, 0.4, 0.4)
        })
      }
      
      // Ground line
      page.drawLine({ start: { x: x + 40, y: picCenterY - 100 }, end: { x: x + width - 40, y: picCenterY - 100 }, thickness: 1.5, color: rgb(0.4, 0.4, 0.4) })
      
      // Clouds
      page.drawCircle({ x: picCenterX - 120, y: picCenterY + 60, size: 20, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawCircle({ x: picCenterX - 100, y: picCenterY + 70, size: 25, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
      page.drawCircle({ x: picCenterX - 80, y: picCenterY + 60, size: 20, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1.5 })
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
      // Draw memory card grid with actual items
      const memItems = content.items || ['Star', 'Heart', 'Moon', 'Sun', 'Flower', 'Tree', 'Cloud', 'Fish']
      const memPairs = content.pairs || memItems.length
      const memCols = 4
      const memRows = Math.ceil(memPairs * 2 / memCols)
      const memCardW = (width - 60) / memCols
      const memCardH = Math.min(memCardW * 1.3, (height - 100) / memRows)
      
      page.drawText('Memory Match Cards - Cut out and find the matching pairs!', { x: x + 20, y: y + height - 20, size: 10, font: boldFont, color: pColor })
      
      // Create pairs of cards (each item appears twice)
      const allCards = []
      for (let i = 0; i < Math.min(memPairs, memItems.length); i++) {
        allCards.push(memItems[i])
        allCards.push(memItems[i])
      }
      
      // Shuffle the cards
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allCards[i], allCards[j]] = [allCards[j], allCards[i]]
      }
      
      for (let i = 0; i < allCards.length; i++) {
        const col = i % memCols
        const row = Math.floor(i / memCols)
        const cardX = x + 30 + col * memCardW
        const cardY = y + height - 50 - (row + 1) * memCardH
        
        // Draw card border
        page.drawRectangle({ 
          x: cardX, 
          y: cardY, 
          width: memCardW - 10, 
          height: memCardH - 10, 
          borderColor: rgb(0.3, 0.3, 0.3), 
          borderWidth: 1.5 
        })
        
        // Draw item name on card
        const itemText = allCards[i] || '?'
        const textWidth = itemText.length * 5
        page.drawText(itemText, { 
          x: cardX + (memCardW - 10) / 2 - textWidth / 2, 
          y: cardY + (memCardH - 10) / 2 - 5, 
          size: 10, 
          font: boldFont, 
          color: pColor 
        })
      }
      
      // Add legend at bottom
      page.drawText(`Find ${memPairs} matching pairs!`, { x: centerX - 50, y: y + 15, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
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
      const vpSeed = content.seed || Date.now()
      
      // Helper function for seeded random
      const vpSeededRandom = (seed) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      puzzles.forEach((p, idx) => {
        if (vpY > y + 130) {
          page.drawText(`${idx + 1}. ${stripEmojis(p)}`, { x: x + 20, y: vpY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
          
          // Draw actual visual content based on puzzle type
          const boxY = vpY - 75
          const boxHeight = 55
          const boxWidth = width - 60
          
          // Draw container box
          page.drawRectangle({ x: x + 30, y: boxY, width: boxWidth, height: boxHeight, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 })
          
          if (p.includes('shape') || p.includes('belong') || p.includes('odd')) {
            // Draw 5 shapes, one is different
            const shapeSize = 18
            const spacing = boxWidth / 6
            const shapeY = boxY + boxHeight / 2
            const oddIndex = Math.floor(vpSeededRandom(vpSeed + idx * 100) * 5)
            
            for (let s = 0; s < 5; s++) {
              const shapeX = x + 50 + s * spacing
              if (s === oddIndex) {
                // Draw a different shape (triangle)
                page.drawLine({ start: { x: shapeX, y: shapeY - shapeSize / 2 }, end: { x: shapeX + shapeSize / 2, y: shapeY + shapeSize / 2 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: shapeX + shapeSize / 2, y: shapeY + shapeSize / 2 }, end: { x: shapeX - shapeSize / 2, y: shapeY + shapeSize / 2 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: shapeX - shapeSize / 2, y: shapeY + shapeSize / 2 }, end: { x: shapeX, y: shapeY - shapeSize / 2 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
              } else {
                // Draw circles
                page.drawCircle({ x: shapeX, y: shapeY, size: shapeSize / 2, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
              }
            }
          } else if (p.includes('triangle') || p.includes('count')) {
            // Draw overlapping triangles to count
            const triSize = 40
            const triCenterX = x + 30 + boxWidth / 2
            const triY = boxY + 8
            
            // Main triangle
            page.drawLine({ start: { x: triCenterX, y: triY + triSize }, end: { x: triCenterX + triSize / 2, y: triY }, thickness: 2, color: rgb(0.2, 0.2, 0.2) })
            page.drawLine({ start: { x: triCenterX + triSize / 2, y: triY }, end: { x: triCenterX - triSize / 2, y: triY }, thickness: 2, color: rgb(0.2, 0.2, 0.2) })
            page.drawLine({ start: { x: triCenterX - triSize / 2, y: triY }, end: { x: triCenterX, y: triY + triSize }, thickness: 2, color: rgb(0.2, 0.2, 0.2) })
            // Inner lines creating more triangles
            page.drawLine({ start: { x: triCenterX - triSize / 4, y: triY + triSize / 2 }, end: { x: triCenterX + triSize / 4, y: triY + triSize / 2 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
            page.drawLine({ start: { x: triCenterX, y: triY }, end: { x: triCenterX, y: triY + triSize / 2 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
            page.drawLine({ start: { x: triCenterX - triSize / 4, y: triY + triSize / 2 }, end: { x: triCenterX, y: triY + triSize }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
            page.drawLine({ start: { x: triCenterX + triSize / 4, y: triY + triSize / 2 }, end: { x: triCenterX, y: triY + triSize }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
            
            page.drawText('How many? ____', { x: triCenterX + triSize, y: triY + triSize / 2, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
          } else if (p.includes('pattern') || p.includes('next')) {
            // Draw a pattern sequence
            const patternY = boxY + boxHeight / 2
            const shapeSize = 15
            const spacing = boxWidth / 7
            
            // Draw alternating pattern: circle, square, circle, square, ?
            for (let s = 0; s < 5; s++) {
              const px = x + 50 + s * spacing
              if (s === 4) {
                // Question mark for missing piece
                page.drawRectangle({ x: px - shapeSize / 2, y: patternY - shapeSize / 2, width: shapeSize, height: shapeSize, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1, opacity: 0.5 })
                page.drawText('?', { x: px - 4, y: patternY - 6, size: 14, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
              } else if (s % 2 === 0) {
                // Circles
                page.drawCircle({ x: px, y: patternY, size: shapeSize / 2, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
              } else {
                // Squares
                page.drawRectangle({ x: px - shapeSize / 2, y: patternY - shapeSize / 2, width: shapeSize, height: shapeSize, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
              }
            }
          } else if (p.includes('mirror')) {
            // Draw shape and mirror options
            const mirrorY = boxY + boxHeight / 2
            const mirrorSize = 20
            
            // Original shape (L-shape)
            page.drawLine({ start: { x: x + 60, y: mirrorY + mirrorSize }, end: { x: x + 60, y: mirrorY - mirrorSize }, thickness: 3, color: rgb(0.2, 0.2, 0.2) })
            page.drawLine({ start: { x: x + 60, y: mirrorY - mirrorSize }, end: { x: x + 80, y: mirrorY - mirrorSize }, thickness: 3, color: rgb(0.2, 0.2, 0.2) })
            
            page.drawText('=', { x: x + 95, y: mirrorY - 5, size: 16, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
            
            // Options A, B, C
            const options = ['A', 'B', 'C']
            for (let o = 0; o < 3; o++) {
              const optX = x + 120 + o * 70
              page.drawText(options[o] + ')', { x: optX, y: mirrorY + 15, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
              
              // Draw slightly different L shapes
              if (o === 0) {
                // Correct mirror
                page.drawLine({ start: { x: optX + 20, y: mirrorY + mirrorSize - 10 }, end: { x: optX + 20, y: mirrorY - mirrorSize - 10 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: optX + 20, y: mirrorY - mirrorSize - 10 }, end: { x: optX, y: mirrorY - mirrorSize - 10 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
              } else if (o === 1) {
                // Rotated
                page.drawLine({ start: { x: optX, y: mirrorY - 5 }, end: { x: optX + 25, y: mirrorY - 5 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: optX + 25, y: mirrorY - 5 }, end: { x: optX + 25, y: mirrorY - 20 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
              } else {
                // Different
                page.drawLine({ start: { x: optX + 10, y: mirrorY + 10 }, end: { x: optX + 10, y: mirrorY - 15 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: optX + 10, y: mirrorY - 15 }, end: { x: optX + 25, y: mirrorY - 15 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
              }
            }
          } else if (p.includes('matching') || p.includes('pair')) {
            // Draw pairs to match
            const pairY = boxY + boxHeight / 2
            const shapeSize = 14
            
            // Left side shapes
            const leftShapes = [
              { type: 'circle', label: '1' },
              { type: 'square', label: '2' },
              { type: 'triangle', label: '3' }
            ]
            
            for (let i = 0; i < 3; i++) {
              const ly = pairY + 15 - i * 18
              page.drawText(leftShapes[i].label + '.', { x: x + 40, y: ly - 4, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
              
              if (leftShapes[i].type === 'circle') {
                page.drawCircle({ x: x + 65, y: ly, size: shapeSize / 2, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1.5 })
              } else if (leftShapes[i].type === 'square') {
                page.drawRectangle({ x: x + 55, y: ly - shapeSize / 2, width: shapeSize, height: shapeSize, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1.5 })
              } else {
                page.drawLine({ start: { x: x + 65, y: ly + shapeSize / 2 }, end: { x: x + 72, y: ly - shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: x + 72, y: ly - shapeSize / 2 }, end: { x: x + 58, y: ly - shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: x + 58, y: ly - shapeSize / 2 }, end: { x: x + 65, y: ly + shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
              }
            }
            
            // Draw connecting area
            page.drawText('Match!', { x: centerX - 20, y: pairY, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
            
            // Right side (shuffled) with letters
            const rightLabels = ['A', 'B', 'C']
            const rightTypes = ['triangle', 'circle', 'square'] // Shuffled order
            
            for (let i = 0; i < 3; i++) {
              const ry = pairY + 15 - i * 18
              const rx = x + boxWidth - 40
              
              page.drawText(rightLabels[i] + '.', { x: rx - 20, y: ry - 4, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
              
              if (rightTypes[i] === 'circle') {
                page.drawCircle({ x: rx, y: ry, size: shapeSize / 2, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1.5 })
              } else if (rightTypes[i] === 'square') {
                page.drawRectangle({ x: rx - shapeSize / 2, y: ry - shapeSize / 2, width: shapeSize, height: shapeSize, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1.5 })
              } else {
                page.drawLine({ start: { x: rx, y: ry + shapeSize / 2 }, end: { x: rx + 7, y: ry - shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: rx + 7, y: ry - shapeSize / 2 }, end: { x: rx - 7, y: ry - shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
                page.drawLine({ start: { x: rx - 7, y: ry - shapeSize / 2 }, end: { x: rx, y: ry + shapeSize / 2 }, thickness: 1.5, color: rgb(0.3, 0.3, 0.3) })
              }
            }
          } else if (p.includes('shadow')) {
            // Draw object and shadow options
            const shadowY = boxY + boxHeight / 2
            
            // Original object (simple house shape)
            page.drawRectangle({ x: x + 50, y: shadowY - 15, width: 25, height: 20, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 2 })
            page.drawLine({ start: { x: x + 50, y: shadowY + 5 }, end: { x: x + 62.5, y: shadowY + 20 }, thickness: 2, color: rgb(0.2, 0.2, 0.2) })
            page.drawLine({ start: { x: x + 62.5, y: shadowY + 20 }, end: { x: x + 75, y: shadowY + 5 }, thickness: 2, color: rgb(0.2, 0.2, 0.2) })
            
            page.drawText('Which shadow?', { x: x + 100, y: shadowY + 10, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
            
            // Shadow options (filled black shapes)
            const shadowOpts = ['A', 'B', 'C']
            for (let s = 0; s < 3; s++) {
              const sx = x + 150 + s * 60
              page.drawText(shadowOpts[s], { x: sx + 8, y: shadowY + 18, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
              
              // Draw filled shadow shape
              page.drawRectangle({ x: sx, y: shadowY - 10, width: 20, height: 15, color: rgb(0.2, 0.2, 0.2) })
              if (s === 0) {
                // Correct shadow
                page.drawLine({ start: { x: sx, y: shadowY + 5 }, end: { x: sx + 10, y: shadowY + 15 }, thickness: 8, color: rgb(0.2, 0.2, 0.2) })
                page.drawLine({ start: { x: sx + 10, y: shadowY + 15 }, end: { x: sx + 20, y: shadowY + 5 }, thickness: 8, color: rgb(0.2, 0.2, 0.2) })
              }
            }
          } else {
            // Default: draw a simple visual puzzle with shapes
            const defY = boxY + boxHeight / 2
            for (let d = 0; d < 4; d++) {
              const dx = x + 60 + d * (boxWidth / 5)
              if (d === 3) {
                page.drawText('?', { x: dx, y: defY - 8, size: 18, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
              } else {
                page.drawCircle({ x: dx, y: defY, size: 12 + d * 3, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 2 })
              }
            }
          }
          
          vpY -= 105
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
