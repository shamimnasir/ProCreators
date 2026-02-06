#!/usr/bin/env node
/**
 * Batch Rate Limiting Script
 * Adds rate limiting to all content generation APIs
 */

const fs = require('fs').promises
const path = require('path')

// APIs that already have rate limiting (skip these)
const ALREADY_SECURED = [
  '/app/app/api/auth/route.js',
  '/app/app/api/user/profile/route.js',
  '/app/app/api/stripe/checkout/route.js',
  '/app/app/api/subscription/checkout/route.js',
  '/app/app/api/library/save/route.js',
  '/app/app/api/generate/image/route.js',
  '/app/app/api/generate/video/route.js',
  '/app/app/api/blog-creator/generate/route.js',
  '/app/app/api/ai-video-studio/generate/route.js',
  '/app/app/api/ebook-maker/generate/route.js',
]

// All generation API routes to secure
const GENERATION_APIS = [
  '/app/app/api/activity-book/generate/route.js',
  '/app/app/api/ad-copy/generate/route.js',
  '/app/app/api/business-plan/generate-pdf/route.js',
  '/app/app/api/business-plan/generate/route.js',
  '/app/app/api/checklist-maker/generate-structure/route.js',
  '/app/app/api/checklist-maker/generate/route.js',
  '/app/app/api/citation-generator/generate/route.js',
  '/app/app/api/coloring-book/generate/route.js',
  '/app/app/api/cover-letter/generate/route.js',
  '/app/app/api/ebook-maker/generate-chapter/route.js',
  '/app/app/api/ebook-maker/generate-outline/route.js',
  '/app/app/api/ebook-maker/generate-pdf/route.js',
  '/app/app/api/email-campaigns/generate/route.js',
  '/app/app/api/essay-helper/generate/route.js',
  '/app/app/api/exam-prep/generate/route.js',
  '/app/app/api/flashcards/generate-blank-template/route.js',
  '/app/app/api/flashcards/generate-pdf/route.js',
  '/app/app/api/flashcards/generate/route.js',
  '/app/app/api/generate/carousel/content-map/route.js',
  '/app/app/api/generate/carousel/route.js',
  '/app/app/api/generate/text/route.js',
  '/app/app/api/generate/video/edit/route.js',
  '/app/app/api/generate/video/generate/route.js',
  '/app/app/api/generate/video/script/route.js',
  '/app/app/api/generate/voice/route.js',
  '/app/app/api/how-to-guide/generate-structure/route.js',
  '/app/app/api/how-to-guide/generate/route.js',
  '/app/app/api/interview-prep/generate/route.js',
  '/app/app/api/journal-maker/generate-pdf/route.js',
  '/app/app/api/journal-maker/generate-structure/route.js',
  '/app/app/api/journal-maker/generate/route.js',
  '/app/app/api/landing-page-copy/generate/route.js',
  '/app/app/api/lesson-planner/generate/route.js',
  '/app/app/api/linkedin-posts/generate/route.js',
  '/app/app/api/marketing-strategy/generate-pdf/route.js',
  '/app/app/api/marketing-strategy/generate/route.js',
  '/app/app/api/networking-message/generate/route.js',
  '/app/app/api/notion-templates/generate/route.js',
  '/app/app/api/pitch-deck/generate-pdf/route.js',
  '/app/app/api/pitch-deck/generate/route.js',
  '/app/app/api/planner-maker/generate/route.js',
  '/app/app/api/professional-email/generate/route.js',
  '/app/app/api/quiz-maker/generate/route.js',
  '/app/app/api/recipe-book/generate-structure/route.js',
  '/app/app/api/recipe-book/generate/route.js',
  '/app/app/api/resume-builder/generate/route.js',
  '/app/app/api/salary-negotiator/generate/route.js',
  '/app/app/api/slides-maker/generate-image/route.js',
  '/app/app/api/slides-maker/generate-pdf/route.js',
  '/app/app/api/slides-maker/generate/route.js',
  '/app/app/api/story-reels/generate-preview/route.js',
  '/app/app/api/story-reels/generate-script/route.js',
  '/app/app/api/storybook-maker/generate/route.js',
  '/app/app/api/study-notes/generate/route.js',
  '/app/app/api/swot-analysis/generate-pdf/route.js',
  '/app/app/api/swot-analysis/generate/route.js',
  '/app/app/api/transformation-video/generate-async/route.js',
  '/app/app/api/transformation-video/generate-scenes/route.js',
  '/app/app/api/transformation-video/generate/route.js',
  '/app/app/api/video-editor/generate-clip/route.js',
  '/app/app/api/worksheet-maker/generate-pdf/route.js',
  '/app/app/api/worksheet-maker/generate-structure/route.js',
  '/app/app/api/worksheet-maker/generate/route.js',
  '/app/app/api/youtube-creator/generate/route.js',
]

const RATE_LIMIT_IMPORT = "import { enforceRateLimit } from '@/lib/rate-limiter'"

const RATE_LIMIT_CHECK = `
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
`

async function addRateLimitToFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8')
    
    // Skip if already has rate limiting
    if (content.includes('enforceRateLimit') || content.includes('rate-limiter')) {
      return { file: filePath, status: 'skipped', reason: 'already has rate limiting' }
    }
    
    // Find the last import statement
    const importLines = content.match(/^import .* from .*$/gm)
    if (!importLines || importLines.length === 0) {
      return { file: filePath, status: 'skipped', reason: 'no imports found' }
    }
    
    const lastImport = importLines[importLines.length - 1]
    const lastImportIndex = content.lastIndexOf(lastImport)
    
    // Add the rate limiter import after the last import
    content = content.slice(0, lastImportIndex + lastImport.length) + 
              '\n' + RATE_LIMIT_IMPORT + 
              content.slice(lastImportIndex + lastImport.length)
    
    // Find POST function and add rate limit check
    // Pattern 1: export async function POST(request) { try {
    const pattern1 = /export\s+async\s+function\s+POST\s*\(\s*request\s*\)\s*\{\s*\n?\s*try\s*\{/
    // Pattern 2: export async function POST(request) { (without try)
    const pattern2 = /export\s+async\s+function\s+POST\s*\(\s*request\s*\)\s*\{/
    
    if (pattern1.test(content)) {
      content = content.replace(pattern1, (match) => {
        return match + RATE_LIMIT_CHECK
      })
    } else if (pattern2.test(content)) {
      content = content.replace(pattern2, (match) => {
        return match + '\n  try {' + RATE_LIMIT_CHECK
      })
      // This case needs manual review as we're adding try block
      return { file: filePath, status: 'needs-review', reason: 'added try block - verify manually' }
    } else {
      return { file: filePath, status: 'skipped', reason: 'POST function pattern not found' }
    }
    
    await fs.writeFile(filePath, content, 'utf-8')
    return { file: filePath, status: 'success' }
    
  } catch (error) {
    return { file: filePath, status: 'error', reason: error.message }
  }
}

async function main() {
  console.log('🔒 Adding Rate Limiting to Generation APIs...\n')
  
  const results = {
    success: [],
    skipped: [],
    error: [],
    needsReview: []
  }
  
  for (const apiPath of GENERATION_APIS) {
    // Check if file exists
    try {
      await fs.access(apiPath)
    } catch {
      results.skipped.push({ file: apiPath, reason: 'file not found' })
      continue
    }
    
    const result = await addRateLimitToFile(apiPath)
    
    if (result.status === 'success') {
      results.success.push(result)
      console.log(`✅ ${path.basename(path.dirname(apiPath))}`)
    } else if (result.status === 'skipped') {
      results.skipped.push(result)
      console.log(`⏭️  ${path.basename(path.dirname(apiPath))} - ${result.reason}`)
    } else if (result.status === 'needs-review') {
      results.needsReview.push(result)
      console.log(`⚠️  ${path.basename(path.dirname(apiPath))} - ${result.reason}`)
    } else {
      results.error.push(result)
      console.log(`❌ ${path.basename(path.dirname(apiPath))} - ${result.reason}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${results.success.length}`)
  console.log(`   ⏭️  Skipped: ${results.skipped.length}`)
  console.log(`   ⚠️  Needs Review: ${results.needsReview.length}`)
  console.log(`   ❌ Errors: ${results.error.length}`)
  console.log(`\n   Total APIs secured: ${results.success.length + ALREADY_SECURED.length}`)
}

main().catch(console.error)
