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
    console.log('⚡ Step 3: JavaScript Functionality - Received request');
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
        htmlExists: !!parsedBody.html,
        htmlLength: parsedBody.html?.length || 0 
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

    const { prompt, html, title, description } = parsedBody;
    
    if (!prompt || !html) {
      console.error('❌ Missing required data:', { 
        hasPrompt: !!prompt, 
        hasHtml: !!html 
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Both prompt and HTML content are required'
        })
      };
    }

    console.log('⚡ Adding JavaScript functionality for:', prompt.substring(0, 50) + '...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3072,
      },
    });

    console.log('✅ Model initialized for JavaScript generation');

    // JavaScript generation prompt
    const jsPrompt = `
Take this styled HTML and add JavaScript functionality to make it interactive:

HTML:
${html}

Original request: "${prompt}"

Add JavaScript that includes:
- Interactive functionality based on the original request
- Form validation and submission handling if forms exist
- Smooth animations and transitions
- Event listeners for user interactions
- Dynamic content updates where appropriate
- Mobile-friendly touch interactions
- Loading states and user feedback
- Error handling for user actions
- Clean, modular, and well-commented code
- Modern JavaScript (ES6+) features

For games: Add complete game logic, scoring, win/lose conditions
For forms: Add validation, data handling, success/error states
For interactive apps: Add all necessary functionality to make it fully working

Add the JavaScript inside <script> tags at the end of the <body>.
Return the complete HTML with embedded CSS and JavaScript.
No explanations, just the functional HTML code.
`;

    console.log('🚀 Generating JavaScript functionality...');

    // Generate functional HTML with timeout (increased to 15 seconds)
    const response = await withTimeout(
      model.generateContent(jsPrompt),
      15000 // 15 second timeout for this step
    );

    const result = await response.response;
    let functionalHtml = result.text();

    console.log('⚡ Raw functional HTML response length:', functionalHtml.length);

    // Clean up the response
    functionalHtml = functionalHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract final metadata
    const titleMatch = functionalHtml.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = functionalHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    
    const finalTitle = titleMatch ? titleMatch[1] : (title || 'Generated Website');
    const finalDescription = descriptionMatch ? descriptionMatch[1] : (description || 'AI-generated interactive website');

    console.log('✅ JavaScript functionality added successfully');
    console.log('📊 Final title:', finalTitle);
    console.log('📊 Final description:', finalDescription);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        step: 'functionality',
        data: {
          html: functionalHtml,
          title: finalTitle,
          description: finalDescription,
          prompt: prompt,
          generatedAt: new Date().toISOString(),
          isComplete: true
        }
      })
    };

  } catch (error) {
    console.error('💥 Error in JavaScript functionality step:', {
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
        step: 'functionality',
        error: 'Failed to generate JavaScript functionality',
        details: error.message || 'Unknown error occurred',
        errorType,
        timestamp: new Date().toISOString()
      })
    };
  }
};
