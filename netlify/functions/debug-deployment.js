// Simple test endpoint to verify deployment
exports.handler = async (event, context) => {
  console.log('🔍 Debug endpoint called');
  console.log('📍 Event details:', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
    body: event.body ? event.body.substring(0, 100) : null
  });
  
  console.log('🔧 Context details:', {
    functionName: context.functionName,
    memoryLimitInMB: context.memoryLimitInMB,
    remainingTimeInMillis: context.getRemainingTimeInMillis(),
    awsRequestId: context.awsRequestId
  });
  
  console.log('🌍 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
    geminiApiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
  });

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      deployment: {
        environment: process.env.NODE_ENV || 'unknown',
        nodeVersion: process.version,
        memoryLimit: context.memoryLimitInMB,
        functionName: context.functionName,
        awsRegion: process.env.AWS_REGION || 'unknown'
      },
      apiKeys: {
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
        geminiLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
      },
      request: {
        method: event.httpMethod,
        path: event.path,
        userAgent: event.headers['user-agent'] || 'unknown',
        origin: event.headers.origin || 'unknown'
      }
    })
  };
};
