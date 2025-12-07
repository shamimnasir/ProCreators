const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

async function testNeuralVoice() {
  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-cloud-tts-credentials.json'
    });

    const testText = "Testing Neural2 voice for English text to speech.";
    
    console.log('\n=== Testing English TTS with Neural2-A ===');
    
    const voiceName = 'en-US-Neural2-A';
    const languageCode = 'en-US';
    
    const request = {
      input: { text: testText },
      voice: {
        name: voiceName,
        languageCode: languageCode,
        ssmlGender: 'MALE'
        // NO model parameter for Neural2
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };
    
    console.log('Request:', JSON.stringify(request, null, 2));
    
    const [response] = await client.synthesizeSpeech(request);
    fs.writeFileSync('/tmp/test-neural2.mp3', response.audioContent, 'binary');
    
    console.log('✅ SUCCESS - Size:', response.audioContent.length, 'bytes\n');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

testNeuralVoice();
