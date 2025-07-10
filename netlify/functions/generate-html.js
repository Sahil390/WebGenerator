const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper function to create timeout promise
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

exports.handler = async (event, context) => {
  // Set function timeout context and memory optimization
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔥 Step 1: HTML Generation - Received request');
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'Not set');
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Gemini API key not configured'
        })
      };
    }

    // Parse request body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body || '{}');
      console.log('📝 Parsed body:', { 
        promptExists: !!parsedBody.prompt,
        promptLength: parsedBody.prompt?.length || 0 
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { prompt } = parsedBody;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('❌ Invalid prompt:', { prompt, type: typeof prompt });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid prompt - must be a non-empty string'
        })
      };
    }

    console.log('📝 Generating HTML structure for prompt:', prompt.substring(0, 50) + '...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    console.log('✅ Model initialized for HTML generation');

    // Simplified prompt for HTML structure only
    const htmlPrompt = `
Based on this request: "${prompt}"

Create ONLY the HTML structure for this website. Focus on:
- Semantic HTML5 structure
- Proper headings hierarchy
- Content sections and layout
- Basic form elements if needed
- NO CSS styling (just basic HTML)
- NO JavaScript functionality
- Use placeholder content where appropriate

Respond with clean HTML code only, no explanations or markdown.
`;

    console.log('🚀 Generating HTML structure...');

    // Generate HTML with timeout
    const response = await withTimeout(
      model.generateContent(htmlPrompt),
      8000 // 8 second timeout for this step
    );

    const result = await response.response;
    let htmlContent = result.text();

    console.log('📄 Raw HTML response length:', htmlContent.length);

    // Clean up the response
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract basic info
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Generated Website';

    console.log('✅ HTML structure generated successfully');
    console.log('📊 Generated title:', title);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        step: 'html',
        data: {
          html: htmlContent,
          title: title,
          prompt: prompt,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('💥 Error in HTML generation step:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let statusCode = 500;
    let errorType = error.name || 'UnknownError';
    
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      statusCode = 502;
      errorType = 'TimeoutError';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        step: 'html',
        error: 'Failed to generate HTML structure',
        details: error.message || 'Unknown error occurred',
        errorType,
        timestamp: new Date().toISOString()
      })
    };
  }
};
