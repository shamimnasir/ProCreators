// Credit Integration Script for ProCreators Tools
// This script adds credit checking, deduction, and refund logic to all tools

const fs = require('fs');
const path = require('path');

// Tools that need credit integration (from our scan)
const TOOLS_TO_FIX = [
  'activity-book',
  'business-plan', 
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

// Credit import statement to add
const CREDIT_IMPORT = `import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'`;

// Credit check code to add after rate limiting
const CREDIT_CHECK_CODE = (toolId) => `
    // SECURITY: Get user ID and check credits
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, '${toolId}')
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: \`Insufficient credits. This tool costs \${creditCheck.cost} credits, but you have \${creditCheck.currentBalance}.\`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, '${toolId}')
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    const transactionId = deductResult.transactionId
`;

console.log('Credit Integration Script');
console.log('========================');
console.log(`Tools to fix: ${TOOLS_TO_FIX.length}`);
console.log('');

TOOLS_TO_FIX.forEach(tool => {
  const filePath = path.join('/app/app/api', tool, 'generate/route.js');
  console.log(`Checking: ${tool}`);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('deductCredits') || content.includes('checkCredits')) {
      console.log(`  ✅ Already has credit integration`);
    } else {
      console.log(`  ⚠️ Needs credit integration`);
    }
  } else {
    console.log(`  ❌ File not found: ${filePath}`);
  }
});
