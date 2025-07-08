exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🧪 Test function called');
    
    // Test the same initialization as generate-website
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'API key missing',
          details: 'GEMINI_API_KEY environment variable is not set'
        })
      };
    }

    console.log('✅ API key found');

    // Test AI initialization
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 1.0,
        topP: 0.98,
        topK: 128,
        maxOutputTokens: 1024, // Smaller for test
        candidateCount: 1,
      }
    });

    console.log('✅ AI model initialized');

    // Test a simple generation
    const testPrompt = 'Create a simple HTML div with "Hello World" text';
    console.log('🎯 Testing simple generation...');
    
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Test generation successful');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'All tests passed',
        data: {
          aiResponse: text.substring(0, 200) + '...',
          responseLength: text.length,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString()
      })
    };
  }
};
