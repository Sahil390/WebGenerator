exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Debug information
    const debug = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      geminiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + '...' : 'missing',
      environment: process.env.NODE_ENV || 'production',
      memoryLimit: context.memoryLimitInMB || 'unknown',
      functionName: context.functionName || 'unknown',
      region: process.env.AWS_REGION || 'unknown'
    };

    console.log('🔍 Debug information:', debug);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        debug,
        message: 'Debug information retrieved successfully'
      })
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
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
