// Test script to verify PDF generation with non-ASCII characters
const fetch = require('node-fetch');

async function testPDFGeneration() {
  try {
    const response = await fetch('http://localhost:3000/api/quiz-maker/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate-pdf',
        quizType: 'custom',
        customPrompt: 'Create a quiz about Bengali language basics',
        questionCount: 3,
        questionTypes: ['multiple-choice'],
        title: 'বাংলা ভাষার মূল বিষয়', // Bengali title with non-ASCII characters
        generateCover: false,
        includeAnswerKey: true
      })
    });

    const result = await response.json();
    console.log('Test result:', result);
    
    if (result.success) {
      console.log('✅ PDF generation successful!');
      console.log('Download URL:', result.downloadUrl);
    } else {
      console.log('❌ PDF generation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPDFGeneration();