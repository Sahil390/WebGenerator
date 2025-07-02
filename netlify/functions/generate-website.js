const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
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

    // Get the generative model with error handling
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
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

    // Enhanced prompt for better website generation
    const enhancedPrompt = `
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

    console.log('🚀 Starting content generation...');
    let result, response, generatedHTML;
    
    try {
      result = await model.generateContent(enhancedPrompt);
      console.log('📨 Got result from Gemini');
    } catch (generateError) {
      console.error('❌ Gemini API call failed:', generateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'AI generation failed',
          details: generateError.message || 'Failed to call Gemini API'
        })
      };
    }
    
    try {
      response = await result.response;
      console.log('📨 Got response from result');
    } catch (responseError) {
      console.error('❌ Failed to get response:', responseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to process AI response',
          details: responseError.message
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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate website',
        details: error.message || 'Unknown error occurred',
        errorType: error.name || 'UnknownError'
      })
    };
  }
};
