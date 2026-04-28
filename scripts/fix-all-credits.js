#!/usr/bin/env node
// Automated Credit Integration Script
// Adds credit checking, deduction, refund to all tools

const fs = require('fs');
const path = require('path');

const TOOLS = [
  'checklist-maker',
  'citation-generator', 
  'cover-letter',
  'email-campaigns',
  'essay-helper',
  'exam-prep',
  'how-to-guide',
  'interview-prep',
  'journal-maker',
  'landing-page-copy',
  'marketing-strategy',
  'networking-message',
  'notion-templates',
  'pitch-deck',
  'planner-maker',
  'professional-email',
  'quiz-maker',
  'resume-builder',
  'salary-negotiator',
  'slides-maker',
  'storybook-maker',
  'study-notes',
  'swot-analysis',
  'worksheet-maker',
  'youtube-creator'
];

const CREDIT_IMPORT = "import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'";

function addCreditIntegration(toolId, filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has credit integration
  if (content.includes('deductCredits') || content.includes('checkCredits')) {
    console.log(`  ✅ Already has credits: ${toolId}`);
    return false;
  }
  
  // 1. Add import if not present
  if (!content.includes("from '@/lib/credits'")) {
    // Find the last import statement
    const importMatch = content.match(/^(import .+\n)+/m);
    if (importMatch) {
      const lastImportEnd = importMatch[0].length;
      content = content.slice(0, lastImportEnd) + CREDIT_IMPORT + '\n\n' + `const TOOL_ID = '${toolId}'\n` + content.slice(lastImportEnd);
    }
  }
  
  // 2. Replace export async function POST pattern
  const postPattern = /export async function POST\(request\) \{\s*try \{/;
  const postReplacement = `export async function POST(request) {
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Get user ID and check credits
    userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, TOOL_ID)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: \`Insufficient credits. This tool costs \${creditCheck.cost} credits, but you have \${creditCheck.currentBalance}.\`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, TOOL_ID)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId
`;
  
  if (postPattern.test(content)) {
    content = content.replace(postPattern, postReplacement);
  }
  
  // 3. Update success returns to complete transaction
  // Find "return NextResponse.json({ success: true" patterns and add completeTransaction before them
  content = content.replace(
    /(\s+)(return NextResponse\.json\(\{\s*success:\s*true)/g,
    `$1// Complete transaction on success
$1if (transactionId) await completeTransaction(transactionId)
$1$2`
  );
  
  // 4. Update error catch to refund
  content = content.replace(
    /\} catch \(error\) \{\s*console\.error\(/g,
    `} catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error(`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`  ✅ Fixed: ${toolId}`);
  return true;
}

console.log('Credit Integration Script');
console.log('========================');
console.log(`Tools to process: ${TOOLS.length}\n`);

let fixed = 0;
let skipped = 0;
let notFound = 0;

TOOLS.forEach(tool => {
  const filePath = path.join('/app/app/api', tool, 'generate/route.js');
  
  if (fs.existsSync(filePath)) {
    console.log(`Processing: ${tool}`);
    if (addCreditIntegration(tool, filePath)) {
      fixed++;
    } else {
      skipped++;
    }
  } else {
    console.log(`  ❌ File not found: ${tool}`);
    notFound++;
  }
});

console.log('\n========================');
console.log(`Fixed: ${fixed}`);
console.log(`Skipped (already had credits): ${skipped}`);
console.log(`Not found: ${notFound}`);
