const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

async function testTTS() {
  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-cloud-tts-credentials.json'
    });

    const testText = "Hello, this is a test of the text to speech system.";
    
    // Test 1: Simple star name voice "Iapetus" with model parameter
    console.log('\n=== TEST 1: Iapetus with model parameter ===');
    try {
      const request1 = {
        input: { text: testText },
        voice: {
          name: 'Iapetus',
          languageCode: 'en-US',
          model: 'Iapetus'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      console.log('Request:', JSON.stringify(request1, null, 2));
      const [response1] = await client.synthesizeSpeech(request1);
      fs.writeFileSync('/tmp/test1-iapetus-with-model.mp3', response1.audioContent, 'binary');
      console.log('✅ SUCCESS - Audio saved to /tmp/test1-iapetus-with-model.mp3');
      console.log('Size:', response1.audioContent.length, 'bytes\n');
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
    }
    
    // Test 2: Full Chirp3-HD name with model parameter
    console.log('=== TEST 2: en-US-Chirp3-HD-Iapetus with model parameter ===');
    try {
      const request2 = {
        input: { text: testText },
        voice: {
          name: 'en-US-Chirp3-HD-Iapetus',
          languageCode: 'en-US',
          model: 'en-US-Chirp3-HD-Iapetus'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      console.log('Request:', JSON.stringify(request2, null, 2));
      const [response2] = await client.synthesizeSpeech(request2);
      fs.writeFileSync('/tmp/test2-chirp3-with-model.mp3', response2.audioContent, 'binary');
      console.log('✅ SUCCESS - Audio saved to /tmp/test2-chirp3-with-model.mp3');
      console.log('Size:', response2.audioContent.length, 'bytes\n');
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
    }
    
    // Test 3: Full Chirp3-HD name WITHOUT model parameter
    console.log('=== TEST 3: en-US-Chirp3-HD-Iapetus WITHOUT model parameter ===');
    try {
      const request3 = {
        input: { text: testText },
        voice: {
          name: 'en-US-Chirp3-HD-Iapetus',
          languageCode: 'en-US'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      console.log('Request:', JSON.stringify(request3, null, 2));
      const [response3] = await client.synthesizeSpeech(request3);
      fs.writeFileSync('/tmp/test3-chirp3-without-model.mp3', response3.audioContent, 'binary');
      console.log('✅ SUCCESS - Audio saved to /tmp/test3-chirp3-without-model.mp3');
      console.log('Size:', response3.audioContent.length, 'bytes\n');
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
    }
    
    // Test 4: Simple star name WITHOUT model parameter
    console.log('=== TEST 4: Iapetus WITHOUT model parameter ===');
    try {
      const request4 = {
        input: { text: testText },
        voice: {
          name: 'Iapetus',
          languageCode: 'en-US'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      console.log('Request:', JSON.stringify(request4, null, 2));
      const [response4] = await client.synthesizeSpeech(request4);
      fs.writeFileSync('/tmp/test4-iapetus-without-model.mp3', response4.audioContent, 'binary');
      console.log('✅ SUCCESS - Audio saved to /tmp/test4-iapetus-without-model.mp3');
      console.log('Size:', response4.audioContent.length, 'bytes\n');
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
    }
    
    // Test 5: Simple star name without languageCode but with model
    console.log('=== TEST 5: Iapetus with model, NO languageCode ===');
    try {
      const request5 = {
        input: { text: testText },
        voice: {
          name: 'Iapetus',
          model: 'Iapetus'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      console.log('Request:', JSON.stringify(request5, null, 2));
      const [response5] = await client.synthesizeSpeech(request5);
      fs.writeFileSync('/tmp/test5-iapetus-model-only.mp3', response5.audioContent, 'binary');
      console.log('✅ SUCCESS - Audio saved to /tmp/test5-iapetus-model-only.mp3');
      console.log('Size:', response5.audioContent.length, 'bytes\n');
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

testTTS();
