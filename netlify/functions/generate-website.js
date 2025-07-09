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
    console.log('🔥 Website generation request received');
    console.log('🌐 Request details:', {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      bodyExists: !!event.body,
      bodyLength: event.body ? event.body.length : 0,
      queryParams: event.queryStringParameters
    });
    console.log('Environment check:', {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      nodeVersion: process.version,
      region: process.env.AWS_REGION || 'unknown',
      functionName: context.functionName || 'unknown',
      memoryLimit: context.memoryLimitInMB || 'unknown'
    });
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Gemini API key not configured',
          details: 'Please set the GEMINI_API_KEY environment variable'
        })
      };
    }

    // Parse request body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body || '{}');
      console.log('📝 Request parsed:', { 
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

    console.log('📝 Generating website for:', prompt.substring(0, 100) + '...');

    // Initialize Gemini AI
    console.log('🤖 Initializing Gemini AI...');
    let genAI, model;
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log('✅ GoogleGenerativeAI instance created');
      
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.9, // Slightly lower for more consistent quality
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
          candidateCount: 1,
        },
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
      console.log('✅ Gemini model configured successfully');
    } catch (initError) {
      console.error('❌ Failed to initialize Gemini AI:', initError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'AI initialization failed',
          details: initError.message,
          errorType: 'InitializationError'
        })
      };
    }

    // Enhanced contextual prompt
    const enhancedPrompt = `You are a PROFESSIONAL WEB DEVELOPER. Create a website based on the user's request with appropriate complexity and design.

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
    
    // Enhanced generation with retry logic for better reliability
    let genResult;
    let attempts = 0;
    const maxAttempts = 2;
    
    // Primary attempt with retry logic
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🎯 Generation attempt ${attempts}/${maxAttempts}...`);
        console.log('🔧 Model details:', {
          model: 'gemini-1.5-flash',
          maxTokens: 8192,
          temperature: 0.9
        });
        
        genResult = await withTimeout(
          model.generateContent(enhancedPrompt),
          280000 // 4 minutes 40 seconds (under 5 min Netlify limit)
        );
        console.log('✅ Generation succeeded on attempt', attempts);
        break;
      } catch (error) {
        console.log(`⚠️ Generation attempt ${attempts} failed:`, {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200)
        });
        
        // If this is the last attempt or it's not a retryable error, continue to fallback
        if (attempts >= maxAttempts || error.message.includes('API key') || error.message.includes('quota')) {
          console.log('Moving to fallback after all attempts failed');
          
          // Try with simplified but still high-quality prompt
          const fallbackPrompt = `Create a professional website for: "${prompt}"

You are an expert web developer. Create a high-quality, modern website that matches the user's request.

Requirements:
- Modern, responsive design
- Clean, professional appearance
- Smooth animations and interactions
- Mobile-friendly layout
- High-quality visuals and typography

Return exactly these three code blocks:

\`\`\`html
<div class="website-container">
  <header class="header">
    <h1>Your professional content here</h1>
  </header>
  <main class="main-content">
    <!-- Complete website content -->
  </main>
</div>
\`\`\`

\`\`\`css
/* Complete professional CSS styles */
.website-container {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  /* Your complete styles here */
}
\`\`\`

\`\`\`javascript
// Complete interactive JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Your complete interactive code here
});
\`\`\`

Create a beautiful, professional website that fully addresses the user's request.`;

          try {
            console.log('🔄 Attempting high-quality fallback generation...');
            
            genResult = await withTimeout(
              model.generateContent(fallbackPrompt),
              240000 // 4 minute timeout for fallback (still high quality)
            );
            console.log('✅ Fallback generation succeeded');
            break;
          } catch (fallbackError) {
            console.error('❌ All generation attempts failed');
            console.error('Final error:', {
              message: fallbackError.message,
              name: fallbackError.name
            });
            
            // Return appropriate error response
            const lastError = fallbackError.message || error.message;
            
            if (lastError.includes('timed out') || lastError.includes('timeout')) {
              return {
                statusCode: 502,
                headers,
                body: JSON.stringify({
                  success: false,
                  error: 'Generation timeout',
                  details: 'The AI is taking longer than expected to create your high-quality website. Please try again with a slightly simpler description, or wait a moment and try again.',
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
                details: 'Please try again in a few moments. The AI service is optimizing for quality.',
                errorType: 'ServiceError'
              })
            };
          }
        }
        
        // Wait a bit before retry
        if (attempts < maxAttempts) {
          console.log('Waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Process the response with better error handling
    let response, generatedHTML;
    
    try {
      console.log('🔄 Processing AI response...');
      response = await withTimeout(
        genResult.response,
        90000 // 1.5 minute timeout for response processing
      );
      console.log('✅ Response processed successfully');
      
      // Extract text immediately to avoid memory issues
      generatedHTML = response.text();
      console.log('📄 Text extracted successfully', {
        htmlLength: generatedHTML.length,
        hasCodeBlocks: generatedHTML.includes('```'),
        htmlBlockCount: (generatedHTML.match(/```html/gi) || []).length,
        cssBlockCount: (generatedHTML.match(/```css/gi) || []).length,
        jsBlockCount: (generatedHTML.match(/```javascript/gi) || []).length
      });
      
      // Clean up AI objects immediately
      genResult = null;
      response = null;
      
      // Force garbage collection hint (Node.js specific)
      if (global.gc) {
        global.gc();
      }
      
    } catch (responseError) {
      console.error('❌ Response processing failed:', responseError);
      
      // Clean up on error
      genResult = null;
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

    // Parse the three code blocks with improved regex
    const htmlMatch = generatedHTML.match(/```html\s*([\s\S]*?)```/i);
    const cssMatch = generatedHTML.match(/```css\s*([\s\S]*?)```/i);
    const jsMatch = generatedHTML.match(/```javascript\s*([\s\S]*?)```/i);

    console.log('🔍 Parsing results:', {
      htmlFound: !!htmlMatch,
      cssFound: !!cssMatch,
      jsFound: !!jsMatch,
      htmlLength: htmlMatch ? htmlMatch[1].trim().length : 0,
      cssLength: cssMatch ? cssMatch[1].trim().length : 0,
      jsLength: jsMatch ? jsMatch[1].trim().length : 0
    });

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    // Compose a full HTML file for preview
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Generated Website</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@100..900&family=Montserrat:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 0; overflow-x: hidden; }
${css}
</style>
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`;

    // Provide fallback content if parsing failed
    const finalHtml = html || '<div class="p-8 text-center">HTML content not generated properly</div>';
    const finalCss = css || '/* CSS content not generated properly */\nbody { font-family: Arial, sans-serif; padding: 20px; }';
    const finalJs = js || '// JavaScript content not generated properly\nconsole.log("JavaScript not generated");';
    
    // Generate title and description from prompt
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    const description = `Generated website for: ${prompt}`;
    
    // Clean up variables for memory management
    generatedHTML = null;

    console.log('✅ Website generation completed successfully');

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
    
    // Determine appropriate status code and error type
    let statusCode = 500;
    let errorType = 'UnknownError';
    let details = error.message || 'Unknown error occurred';
    
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      statusCode = 502;
      errorType = 'TimeoutError';
      details = 'The AI service is taking longer than expected. Please try again with a shorter description.';
    } else if (error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('429')) {
      statusCode = 429;
      errorType = 'RateLimitError';
      details = 'The AI service is currently experiencing high demand. Please wait 30 seconds and try again.';
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      statusCode = 502;
      errorType = 'NetworkError';
      details = 'Network connectivity issue. Please try again in a few moments.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      errorType = 'AuthenticationError';
      details = 'API key issue. Please check the configuration.';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate website',
        details,
        errorType,
        timestamp: new Date().toISOString()
      })
    };
  }
};
