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

// Helper function for retry logic
const retryOperation = async (operation, maxRetries = 2, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

exports.handler = async (event, context) => {
  // Set function timeout context
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
    console.log('🔥 Received website generation request');
    console.log('Environment check:', {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      httpMethod: event.httpMethod,
      bodyExists: !!event.body,
      nodeVersion: process.version
    });
    
    // Check if API key is configured first
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Gemini API key not configured',
          details: 'Please set the GEMINI_API_KEY environment variable in Netlify dashboard'
        })
      };
    }

    // Parse request body with better error handling
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
          error: 'Invalid JSON in request body',
          details: parseError.message
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
          error: 'Invalid prompt',
          details: 'Prompt is required and must be a non-empty string'
        })
      };
    }

    console.log('📝 Generating website for prompt:', prompt.substring(0, 100) + '...');

    // Initialize Gemini AI with better error handling
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log('✅ Gemini AI initialized');
    } catch (initError) {
      console.error('❌ Failed to initialize Gemini AI:', initError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to initialize AI service',
          details: initError.message
        })
      };
    }

    // Get the generative model with optimized settings for faster response
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096, // Reduced from 8192 for faster response
        }
      });
      console.log('✅ Model initialized successfully');
    } catch (modelError) {
      console.error('❌ Failed to initialize model:', modelError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to initialize AI model',
          details: modelError.message
        })
      };
    }

    // Shorter, more focused prompt for faster generation
    const enhancedPrompt = `
Create a modern, responsive HTML website for: "${prompt}"

Requirements:
- Complete HTML document with embedded CSS
- Responsive design
- Professional styling
- NO external links or navigation
- NO JavaScript that navigates away
- Keep it concise but functional

Return ONLY the HTML code.`;

    console.log('🚀 Starting content generation...');
    let result, response, generatedHTML;
    
    // Use retry logic for Gemini API call with shorter timeout
    try {
      const generateWithRetry = async () => {
        return await withTimeout(
          model.generateContent(enhancedPrompt),
          30000 // Reduced to 30 second timeout
        );
      };
      
      result = await retryOperation(generateWithRetry, 1, 1000); // Reduced to 1 retry
      console.log('📨 Got result from Gemini');
    } catch (generateError) {
      console.error('❌ Gemini API call failed after retries:', generateError);
      
      // Check if it's a timeout error
      if (generateError.message.includes('timed out')) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Request timeout',
            details: 'The AI service is taking too long. Please try with a shorter, more specific prompt.',
            errorType: 'TimeoutError'
          })
        };
      }
      
      // Check if it's a rate limit error
      if (generateError.message.includes('rate limit') || generateError.message.includes('quota')) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            details: 'The AI service is currently busy. Please try again in a few moments.',
            errorType: 'RateLimitError'
          })
        };
      }
      
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'AI generation failed',
          details: generateError.message || 'Failed to call Gemini API',
          errorType: generateError.name || 'ApiError'
        })
      };
    }
    
    try {
      response = await withTimeout(result.response, 10000); // 10 second timeout for response processing
      console.log('📨 Got response from result');
    } catch (responseError) {
      console.error('❌ Failed to get response:', responseError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to process AI response',
          details: responseError.message.includes('timed out') 
            ? 'Response processing timed out. Please try again.' 
            : responseError.message,
          errorType: responseError.message.includes('timed out') ? 'TimeoutError' : 'ResponseError'
        })
      };
    }
    
    try {
      generatedHTML = response.text();
      console.log('📄 Extracted text successfully', {
        htmlLength: generatedHTML.length,
        hasHtmlTag: generatedHTML.includes('<html')
      });
    } catch (textError) {
      console.error('❌ Failed to extract text:', textError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to extract generated content',
          details: textError.message
        })
      };
    }

    // Clean up the generated HTML
    generatedHTML = generatedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract title and description from the generated HTML
    const titleMatch = generatedHTML.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = generatedHTML.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    
    const title = titleMatch ? titleMatch[1] : 'Generated Website';
    const description = descriptionMatch ? descriptionMatch[1] : 'AI-generated website';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: generatedHTML,
          title: title,
          description: description,
          prompt: prompt,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('💥 Error generating website:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Determine appropriate status code based on error
    let statusCode = 500;
    let errorType = error.name || 'UnknownError';
    
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      statusCode = 502;
      errorType = 'TimeoutError';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      statusCode = 429;
      errorType = 'RateLimitError';
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      statusCode = 502;
      errorType = 'NetworkError';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate website',
        details: error.message || 'Unknown error occurred',
        errorType,
        timestamp: new Date().toISOString()
      })
    };
  }
};
