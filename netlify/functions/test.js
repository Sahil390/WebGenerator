exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const testData = {
      message: 'Test function working!',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        netlifyContext: context.functionName || 'unknown'
      },
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: Object.keys(event.headers || {}),
        bodyExists: !!event.body
      }
    };

    console.log('🧪 Test function called:', testData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: testData
      })
    };
  } catch (error) {
    console.error('❌ Test function error:', error);
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
