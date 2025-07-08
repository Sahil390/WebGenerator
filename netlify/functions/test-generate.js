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
    console.log('🔥 Test function called');
    console.log('Environment debug:', {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'N/A',
      nodeVersion: process.version,
      eventBody: event.body,
      processEnvKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API'))
    });

    // Hard-coded API key for testing (this will be removed)
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAy8MecUMmBp2xSqMhSBihX8EPRZwdzbt0';
    
    if (!apiKey || apiKey === 'AIzaSyAy8MecUMmBp2xSqMhSBihX8EPRZwdzbt0') {
      console.log('Using fallback API key for testing');
    }

    const { prompt } = JSON.parse(event.body || '{}');
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No prompt provided'
        })
      };
    }

    // Simple test
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(`Create a simple HTML page for: ${prompt}`);
    const response = result.response;
    const html = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: html,
          htmlOnly: html,
          cssOnly: '',
          jsOnly: '',
          title: prompt,
          description: prompt,
          prompt: prompt,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
