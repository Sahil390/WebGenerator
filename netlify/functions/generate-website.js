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
        model: "gemini-2.5-flash", // Latest and best price-performance model
        generationConfig: {
          temperature: 1.0,          // Higher creativity for better designs
          topP: 0.98,               // More diverse responses
          topK: 128,                // Increased for variety
          maxOutputTokens: 16384,   // Higher limit for complex websites
          candidateCount: 1,        // Single candidate for speed
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

    // Enhanced contextual prompt for adaptive website generation (separate HTML, CSS, JS)
    const enhancedPrompt = `
You are a PROFESSIONAL WEB DEVELOPER. Create a website based on the user's request with appropriate complexity and design.

USER REQUEST: "${prompt}"

IMPORTANT: Match the complexity and design style to the user's request:
- If it's a simple tool/calculator/utility: Create a clean, minimal, functional design
- If it's a business/portfolio/marketing site: Create a modern, professional design
- If it's a creative/artistic site: Create a visually stunning, award-winning design

DESIGN GUIDELINES:
- For simple tools: Focus on functionality, clean layout, minimal colors
- For business sites: Professional, modern, trustworthy appearance
- For creative sites: Bold, innovative, award-winning design trends

MANDATORY REQUIREMENTS:
- Use real images from Unsplash when appropriate (not for simple tools)
- Make it responsive and mobile-friendly
- Include proper hover effects and smooth transitions
- Use modern CSS (Grid, Flexbox, clean typography)
- Add interactive JavaScript for functionality

CRITICAL: You MUST return EXACTLY THREE separate code blocks in this exact format:

\`\`\`html
<div class="container">
  <h1>Your HTML content here</h1>
  <!-- Only include the body content, no <html>, <head>, or <body> tags -->
</div>
\`\`\`

\`\`\`css
/* Complete CSS styles */
.container {
  /* Your CSS styles here */
}
\`\`\`

\`\`\`javascript
// Complete JavaScript code
document.addEventListener('DOMContentLoaded', function() {
  // Your JavaScript code here
});
\`\`\`

IMPORTANT RULES:
1. HTML block: Only include the body content (no DOCTYPE, html, head, body tags)
2. CSS block: Include all styles needed for the website
3. JavaScript block: Include all interactive functionality
4. Each code block must be substantial and complete
5. Do NOT include any explanatory text outside the code blocks
6. Do NOT include empty code blocks

Create a website that perfectly matches the user's request complexity and style!`;

    console.log('🚀 Starting content generation with optimized approach...');
    let result;
    
    // Enhanced generation with progressive timeout and retry logic
    let genResult;
    
    // Primary attempt with optimized timeout
    try {
      console.log('🎯 Primary generation attempt...');
      genResult = await withTimeout(
        model.generateContent(enhancedPrompt),
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
    
    // Parse the three code blocks with improved regex
    const htmlMatch = generatedHTML.match(/```html\s*([\s\S]*?)```/i);
    const cssMatch = generatedHTML.match(/```css\s*([\s\S]*?)```/i);
    const jsMatch = generatedHTML.match(/```javascript\s*([\s\S]*?)```/i);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    // Compose a full HTML file for preview (for backward compatibility)
    const fullHtml = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n<title>Generated Website</title>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@100..900&family=Montserrat:wght@100..900&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\">\n<style>\n* { box-sizing: border-box; }\nbody { margin: 0; padding: 0; overflow-x: hidden; }\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n</script>\n</body>\n</html>`;

    // Provide fallback content if parsing failed
    const finalHtml = html || '<div class="p-8 text-center">HTML content not generated properly</div>';
    const finalCss = css || '/* CSS content not generated properly */\nbody { font-family: Arial, sans-serif; padding: 20px; }';
    const finalJs = js || '// JavaScript content not generated properly\nconsole.log("JavaScript not generated");';
    
    // Clean up variables for memory management
    result = null;
    response = null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          html: fullHtml,
          htmlOnly: finalHtml,
          cssOnly: finalCss,
          jsOnly: finalJs,
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
