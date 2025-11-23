// Test file to verify OpenAI integration works
// Run this in browser console to test the OpenAI service

async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI integration...');
  
  try {
    // Test word generation
    console.log('1. Testing word generation...');
    const { generateNewWords } = await import('./services/openai.js');
    const testWords = await generateNewWords(['cat', 'dog', 'run'], 3);
    console.log('✅ Generated words:', testWords);
    
    // Test story generation  
    console.log('2. Testing story generation...');
    const { generateNewStory } = await import('./services/openai.js');
    const testStory = await generateNewStory(['Test Story', 'Sample Tale']);
    console.log('✅ Generated story:', testStory);
    
    console.log('🎉 OpenAI integration test completed successfully!');
    return { words: testWords, story: testStory };
    
  } catch (error) {
    console.error('❌ OpenAI integration test failed:', error);
    return null;
  }
}

// To test, run this in browser console:
// testOpenAIIntegration()

export { testOpenAIIntegration };