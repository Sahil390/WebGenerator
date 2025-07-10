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
    console.log('🎨 Step 2: CSS Styling - Received request');
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

    const { prompt, html, title } = parsedBody;
    
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

    console.log('🎨 Adding CSS styling to HTML for:', prompt.substring(0, 50) + '...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3072,
      },
    });

    console.log('✅ Model initialized for CSS generation');

    // CSS generation prompt
    const cssPrompt = `
Take this HTML structure and add beautiful, modern CSS styling:

HTML:
${html}

Original request: "${prompt}"

Add CSS that includes:
- Modern, clean design with good color scheme
- Responsive layout that works on all devices
- Smooth animations and hover effects
- Professional typography
- Beautiful gradients or backgrounds where appropriate
- Proper spacing and alignment
- CSS Grid or Flexbox for layout
- Modern CSS features like backdrop-filter, box-shadow
- Floating elements or subtle animations if they enhance the design
- Professional button styles and form elements

Return the complete HTML with embedded CSS in a <style> tag in the <head>.
No explanations, just the styled HTML code.
`;

    console.log('🚀 Generating CSS styling...');

    // Generate styled HTML with timeout
    const response = await withTimeout(
      model.generateContent(cssPrompt),
      8000 // 8 second timeout for this step
    );

    const result = await response.response;
    let styledHtml = result.text();

    console.log('🎨 Raw styled HTML response length:', styledHtml.length);

    // Clean up the response
    styledHtml = styledHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract updated title and description
    const titleMatch = styledHtml.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = styledHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    
    const finalTitle = titleMatch ? titleMatch[1] : (title || 'Generated Website');
    const description = descriptionMatch ? descriptionMatch[1] : 'AI-generated styled website';

    console.log('✅ CSS styling added successfully');
    console.log('📊 Final title:', finalTitle);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        step: 'styles',
        data: {
          html: styledHtml,
          title: finalTitle,
          description: description,
          prompt: prompt,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('💥 Error in CSS styling step:', {
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
        step: 'styles',
        error: 'Failed to generate CSS styling',
        details: error.message || 'Unknown error occurred',
        errorType,
        timestamp: new Date().toISOString()
      })
    };
  }
};
