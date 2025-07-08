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
    console.log('Environment check:', {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      nodeVersion: process.version
    });
    
    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAy8MecUMmBp2xSqMhSBihX8EPRZwdzbt0';
    
    if (!apiKey) {
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 1.0,
        topP: 0.98,
        topK: 128,
        maxOutputTokens: 16384,
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

    console.log('🚀 Starting content generation...');
    
    // Generate content with timeout
    const genResult = await withTimeout(
      model.generateContent(enhancedPrompt),
      120000 // 2 minute timeout
    );
    
    console.log('✅ Content generated successfully');
    
    // Process the response
    const response = genResult.response;
    const generatedHTML = response.text();
    
    console.log('📄 Response processed:', {
      htmlLength: generatedHTML.length,
      hasCodeBlocks: generatedHTML.includes('```'),
      htmlBlockCount: (generatedHTML.match(/```html/gi) || []).length,
      cssBlockCount: (generatedHTML.match(/```css/gi) || []).length,
      jsBlockCount: (generatedHTML.match(/```javascript/gi) || []).length
    });
    
    // Parse the three code blocks
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
