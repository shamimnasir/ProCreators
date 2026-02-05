#!/usr/bin/env node
/**
 * Security Cleanup Script
 * Removes console.log statements from production API code
 * Run: node scripts/remove-console-logs.js
 */

const fs = require('fs')
const path = require('path')

const API_DIR = path.join(__dirname, '..', 'app', 'api')

// Patterns to remove (but keep console.error for real error logging)
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,  // Remove warnings too
]

// Files/directories to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'test',
  '__tests__'
]

let filesProcessed = 0
let logsRemoved = 0

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    for (const pattern of CONSOLE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        logsRemoved += matches.length
        content = content.replace(pattern, '')
        modified = true
      }
    }
    
    if (modified) {
      // Clean up any resulting double newlines
      content = content.replace(/\n{3,}/g, '\n\n')
      fs.writeFileSync(filePath, content, 'utf8')
      filesProcessed++
      console.log(`Cleaned: ${filePath}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    // Skip excluded patterns
    if (SKIP_PATTERNS.some(pattern => fullPath.includes(pattern))) {
      continue
    }
    
    if (entry.isDirectory()) {
      processDirectory(fullPath)
    } else if (entry.isFile()) {
      processFile(fullPath)
    }
  }
}

console.log('Starting console.log cleanup in API routes...')
console.log('Directory:', API_DIR)
console.log('')

if (fs.existsSync(API_DIR)) {
  processDirectory(API_DIR)
  console.log('')
  console.log('=== Cleanup Complete ===')
  console.log(`Files modified: ${filesProcessed}`)
  console.log(`Console statements removed: ${logsRemoved}`)
} else {
  console.error('API directory not found:', API_DIR)
}
