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

    // Get the generative models - primary and fallback
    let primaryModel, fallbackModel;
    try {
      // Primary model with full capabilities
      primaryModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      
      // Fallback model with reduced capabilities for speed
      fallbackModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 20,
          maxOutputTokens: 4096, // Smaller for speed
        }
      });
      
      console.log('✅ Models initialized successfully');
    } catch (modelError) {
      console.error('❌ Failed to initialize models:', modelError);
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

    // Primary prompt (detailed)
    const primaryPrompt = `
Create a complete, modern, responsive HTML website based on this description: "${prompt}"

Requirements:
1. Generate a COMPLETE HTML document with proper structure
2. Include comprehensive CSS styling (embedded in <style> tags)
3. Make it fully responsive and mobile-friendly
4. Use modern CSS techniques (flexbox, grid, etc.)
5. Include interactive JavaScript features where appropriate (but NO navigation or window.location changes)
6. Use semantic HTML elements
7. Ensure accessibility with proper ARIA labels
8. Include meta tags for SEO
9. Use a cohesive color scheme and typography
10. Make it visually appealing and professional

IMPORTANT CONSTRAINTS:
- Do NOT include any links that navigate to external sites
- Do NOT include any JavaScript that changes window.location or document.location
- Do NOT include any window.open() calls
- Make all links either non-functional (#) or use onclick="return false;"
- Do NOT include any form submissions that navigate away
- This is for a PREVIEW ONLY - no actual navigation should occur

The website should be complete and ready to use. Include:
- Header with navigation (but make nav links non-functional for preview)
- Main content sections
- Footer
- Responsive design
- Professional styling
- Interactive elements (hover effects, animations, etc.)
- Modern animations and transitions

Return ONLY the complete HTML code without any markdown formatting or explanations.`;

    // Fallback prompt (simplified but still good)
    const fallbackPrompt = `
Create a modern, responsive HTML website for: "${prompt}"

Requirements:
- Complete HTML document with embedded CSS styling
- Responsive design that works on all devices
- Professional appearance with good color scheme
- Include header, main content, and footer sections
- NO external links or navigation that leaves the page
- Modern CSS with animations and hover effects

Return ONLY the HTML code.`;

    console.log('🚀 Starting content generation with fallback strategy...');
    let result, response, generatedHTML;
    
    // Define primary and fallback operations
    const primaryOperation = async () => {
      return await withTimeout(
        primaryModel.generateContent(primaryPrompt),
        45000 // 45 second timeout for primary
      );
    };
    
    const fallbackOperation = async () => {
      return await withTimeout(
        fallbackModel.generateContent(fallbackPrompt),
        25000 // 25 second timeout for fallback
      );
    };
    
    // Try primary with fallback
    try {
      result = await retryWithFallback(primaryOperation, fallbackOperation, 1, 1000);
      console.log('📨 Got result from Gemini (primary or fallback)');
    } catch (generateError) {
      console.error('❌ Both primary and fallback failed:', generateError);
      
      // Check if it's a timeout error
      if (generateError.message.includes('timed out')) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Request timeout',
            details: 'The AI service is experiencing high load. Please try again with a simpler description or try again later.',
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
