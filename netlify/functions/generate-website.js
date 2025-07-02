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
      httpMethod: event.httpMethod,
      bodyExists: !!event.body
    });
    
    // Initialize Gemini AI inside try block
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Check if API key is configured
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
5. Include interactive JavaScript features where appropriate
6. Use semantic HTML elements
7. Ensure accessibility with proper ARIA labels
8. Include meta tags for SEO
9. Use a cohesive color scheme and typography
10. Make it visually appealing and professional

The website should be complete and ready to use. Include:
- Header with navigation
- Main content sections
- Footer
- Responsive design
- Professional styling
- Interactive elements
- Modern animations and transitions

Return ONLY the complete HTML code without any markdown formatting or explanations.`;

    console.log('🚀 Starting content generation...');
    const result = await model.generateContent(enhancedPrompt);
    
    console.log('📨 Getting response...');
    const response = await result.response;
    
    console.log('📄 Extracting text...');
    let generatedHTML = response.text();

    console.log('✅ Website generated successfully', {
      htmlLength: generatedHTML.length,
      hasHtmlTag: generatedHTML.includes('<html')
    });

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
