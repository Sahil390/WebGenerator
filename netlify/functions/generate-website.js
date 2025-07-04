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

// Helper function for retry logic with fallback
const retryWithFallback = async (primaryOperation, fallbackOperation, maxRetries = 2, delay = 1000) => {
  // Try primary operation first
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Primary attempt ${attempt}...`);
      return await primaryOperation();
    } catch (error) {
      console.log(`Primary attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.log('Primary operation failed, trying fallback...');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  // If primary fails, try fallback
  try {
    console.log('Executing fallback operation...');
    return await fallbackOperation();
  } catch (fallbackError) {
    console.log('Fallback also failed:', fallbackError.message);
    throw fallbackError;
  }
};

exports.handler = async (event, context) => {
  // Set function timeout context and memory optimization
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Increase memory available
  if (context.memoryLimitInMB) {
    console.log(`Memory limit: ${context.memoryLimitInMB}MB`);
  }
  
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

    // Get optimized model for production reliability
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Fast and reliable model
        generationConfig: {
          temperature: 0.7,      // Slightly more focused responses
          topP: 0.8,             // More deterministic
          topK: 20,              // Reduced for consistency
          maxOutputTokens: 3072, // Balanced for performance
          candidateCount: 1,     // Single candidate for speed
        },
        // Add safety settings for production
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      });
      
      console.log('✅ Model initialized with production settings');
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

    // Optimized prompt for better reliability
    const optimizedPrompt = `Create a modern, responsive website for: "${prompt}"

Generate a complete HTML document with:
- Embedded CSS styling (no external files)
- Responsive design
- Professional appearance
- Header, main content, and footer
- Modern colors and typography
- NO external links or navigation

Return only the HTML code without any markdown formatting.`;

    console.log('🚀 Starting content generation with optimized approach...');
    let result;
    
    // Enhanced generation with progressive timeout and retry logic
    let genResult;
    
    // Primary attempt with optimized timeout
    try {
      console.log('🎯 Primary generation attempt...');
      genResult = await withTimeout(
        model.generateContent(optimizedPrompt),
        150000 // 2.5 minute timeout
      );
      console.log('✅ Primary generation succeeded');
    } catch (primaryError) {
      console.log('⚠️ Primary generation failed:', primaryError.message);
      
      // If primary fails, try with simplified prompt
      const fallbackPrompt = `Create a simple website for: "${prompt}"

Generate HTML with:
- Basic structure (header, main, footer)
- Embedded CSS
- Responsive design
- Clean, modern appearance

Return only HTML code:`;

      try {
        console.log('� Attempting fallback generation...');
        genResult = await withTimeout(
          model.generateContent(fallbackPrompt),
          90000 // 1.5 minute timeout for fallback
        );
        console.log('✅ Fallback generation succeeded');
      } catch (fallbackError) {
        console.error('❌ All generation attempts failed');
        
        // Check error types and return appropriate response
        const lastError = fallbackError.message || primaryError.message;
        
        if (lastError.includes('timed out') || lastError.includes('timeout')) {
          return {
            statusCode: 502,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Request timeout',
              details: 'The AI service is taking longer than expected. This usually happens during high traffic. Please try again in a few moments with a shorter description.',
              errorType: 'TimeoutError'
            })
          };
        }
        
        if (lastError.includes('rate limit') || lastError.includes('quota') || lastError.includes('429')) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Service temporarily unavailable',
              details: 'The AI service is currently experiencing high demand. Please wait 30 seconds and try again.',
              errorType: 'RateLimitError'
            })
          };
        }
        
        // Generic error
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Service temporarily unavailable',
            details: 'Please try again in a few moments. If the problem persists, try using a shorter, simpler description.',
            errorType: 'ServiceError'
          })
        };
      }
    }
    
    // Assign the result for further processing
    result = genResult;
    
    // Process the response with better error handling
    let response, generatedHTML;
    
    try {
      console.log('🔄 Processing AI response...');
      response = await withTimeout(
        result.response,
        45000 // 45 second timeout for response processing
      );
      console.log('✅ Response processed successfully');
      
      // Extract text immediately to avoid memory issues
      generatedHTML = response.text();
      console.log('📄 Text extracted successfully', {
        htmlLength: generatedHTML.length,
        hasHtmlTag: generatedHTML.includes('<html'),
        hasBodyTag: generatedHTML.includes('<body')
      });
      
      // Clean up AI objects immediately
      result = null;
      response = null;
      
      // Force garbage collection hint (Node.js specific)
      if (global.gc) {
        global.gc();
      }
      
    } catch (responseError) {
      console.error('❌ Response processing failed:', responseError);
      
      // Clean up on error
      result = null;
      response = null;
      
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Response processing failed',
          details: responseError.message.includes('timed out') 
            ? 'Server is temporarily busy processing your request. Please try again in a moment.' 
            : 'Failed to process AI response. Please try again.',
          errorType: responseError.message.includes('timed out') ? 'ServerBusyError' : 'ResponseError'
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

    console.log('✅ Website generated successfully');
    
    // Clean up variables for memory management
    result = null;
    response = null;

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
