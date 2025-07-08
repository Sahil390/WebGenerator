const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    console.log('🚀 Simple test started');
    
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'API key missing'
        })
      };
    }
    
    // Parse body
    const body = JSON.parse(event.body || '{}');
    const prompt = body.prompt || 'Create a simple HTML page with "Hello World"';
    
    console.log('📝 Testing with prompt:', prompt.substring(0, 50));
    
    // Initialize AI with minimal config
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048, // Smaller for faster response
      }
    });
    
    console.log('🤖 AI initialized, generating...');
    
    // Simple generation with timeout
    const result = await Promise.race([
      model.generateContent(`Create a simple HTML page for: ${prompt}. Return only the HTML code.`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Generation successful, response length:', text.length);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: text,
          prompt: prompt,
          generatedAt: new Date().toISOString()
        }
      })
    };
    
  } catch (error) {
    console.error('❌ Simple test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack?.substring(0, 200)
      })
    };
  }
};
