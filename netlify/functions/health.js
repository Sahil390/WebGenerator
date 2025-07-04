exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'WebGenerator API',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      memory: {
        limit: context.memoryLimitInMB || 'unknown',
        remaining: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 'unknown'
      },
      apiStatus: {
        geminiApiKey: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
        nodeVersion: process.version
      }
    })
  };
};
