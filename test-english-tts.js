const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

async function testEnglishTTS() {
  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-cloud-tts-credentials.json'
    });

    const testText = "Hello! This is a test of the English text to speech system. The quick brown fox jumps over the lazy dog.";
    
    // Test with a Chirp3-HD voice (en-US-Chirp3-HD-Rasalgethi)
    console.log('\n=== Testing English TTS with Chirp3-HD-Rasalgethi ===');
    
    const voiceName = 'en-US-Chirp3-HD-Rasalgethi';
    const languageCode = 'en-US';
    
    const request = {
      input: { text: testText },
      voice: {
        name: voiceName,
        languageCode: languageCode,
        ssmlGender: 'MALE',
        model: voiceName  // Include model parameter as per our fix
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };
    
    console.log('Request configuration:');
    console.log('  Voice Name:', voiceName);
    console.log('  Language Code:', languageCode);
    console.log('  Model:', voiceName);
    console.log('\nCalling Google Cloud TTS API...');
    
    const [response] = await client.synthesizeSpeech(request);
    
    const outputPath = '/tmp/test-english-tts.mp3';
    fs.writeFileSync(outputPath, response.audioContent, 'binary');
    
    console.log('✅ SUCCESS!');
    console.log('  Audio generated successfully');
    console.log('  Size:', response.audioContent.length, 'bytes');
    console.log('  Saved to:', outputPath);
    console.log('\nYou can test the audio file by downloading it from /tmp/test-english-tts.mp3');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('Full error:', error);
  }
}

testEnglishTTS();
