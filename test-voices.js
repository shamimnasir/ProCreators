const textToSpeech = require('@google-cloud/text-to-speech');

async function testVoices() {
  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-cloud-tts-credentials.json'
    });

    console.log('Fetching all voices...\n');
    const [result] = await client.listVoices({});
    const voices = result.voices;
    
    // Filter English voices
    const englishVoices = voices.filter(voice => 
      voice.languageCodes.some(code => code.startsWith('en-'))
    );
    
    console.log(`Total voices: ${voices.length}`);
    console.log(`English voices: ${englishVoices.length}\n`);
    
    // Show some example newer voices (Chirp, Studio, etc.)
    console.log('=== SAMPLE ENGLISH VOICES ===\n');
    englishVoices.slice(0, 20).forEach(voice => {
      console.log(`Name: ${voice.name}`);
      console.log(`  Language Codes: ${voice.languageCodes.join(', ')}`);
      console.log(`  Gender: ${voice.ssmlGender}`);
      console.log('');
    });
    
    // Look for Chirp voices specifically
    const chirpVoices = englishVoices.filter(v => 
      v.name.toLowerCase().includes('chirp') || 
      v.name.toLowerCase().includes('iapetus') ||
      v.name.toLowerCase().includes('rasalgethi')
    );
    
    console.log('\n=== CHIRP/STAR NAME VOICES ===\n');
    chirpVoices.forEach(voice => {
      console.log(`Name: ${voice.name}`);
      console.log(`  Language Codes: ${voice.languageCodes.join(', ')}`);
      console.log(`  Gender: ${voice.ssmlGender}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testVoices();
