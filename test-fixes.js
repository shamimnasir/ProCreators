const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const { exec } = require('child_process');

async function testFixes() {
  console.log('\n=== Testing Both Fixes ===\n');
  
  // Test 1: Check ffmpeg is working
  console.log('1. Testing ffmpeg installation...');
  exec('ffmpeg -version', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ ffmpeg FAILED:', error.message);
    } else {
      console.log('✅ ffmpeg is working:', stdout.split('\n')[0]);
    }
  });
  
  // Test 2: Check TTS without ssmlGender
  console.log('\n2. Testing Google TTS without ssmlGender...');
  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-cloud-tts-credentials.json'
    });

    const testText = "Testing English audio without gender specification.";
    
    const request = {
      input: { text: testText },
      voice: {
        name: 'en-US-Casual-K',
        languageCode: 'en-US'
        // NO ssmlGender parameter
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };
    
    console.log('Request:', JSON.stringify(request, null, 2));
    
    const [response] = await client.synthesizeSpeech(request);
    fs.writeFileSync('/tmp/test-no-gender.mp3', response.audioContent, 'binary');
    
    console.log('✅ TTS SUCCESS - Audio generated:', response.audioContent.length, 'bytes');
    console.log('   Saved to: /tmp/test-no-gender.mp3\n');
    
  } catch (error) {
    console.log('❌ TTS FAILED:', error.message);
  }
}

testFixes();
