import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:8080', 
  'http://localhost:8081', 
  'http://localhost:8082', 
  'http://localhost:3000', 
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082'
];

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Website generation endpoint
app.post('/api/generate-website', async (req, res) => {
  console.log('🔥 Received website generation request');
  console.log('📊 Request headers:', req.headers);
  console.log('📝 Request body:', req.body);
  
  try {
    const { prompt } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    // Enhanced prompt for contextual website generation (separate HTML, CSS, JS)
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

    // Use Gemini 2.5-flash model for faster generations
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 1.0,
        topP: 0.98,
        topK: 128,
        maxOutputTokens: 16384,
      },
    });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const generated = response.text();

    // Parse the three code blocks with improved regex
    const htmlMatch = generated.match(/```html\s*([\s\S]*?)```/i);
    const cssMatch = generated.match(/```css\s*([\s\S]*?)```/i);
    const jsMatch = generated.match(/```javascript\s*([\s\S]*?)```/i);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    // Compose a full HTML file for preview (for backward compatibility)
    const fullHtml = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n<title>Generated Website</title>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@100..900&family=Montserrat:wght@100..900&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\">\n<style>\n* { box-sizing: border-box; }\nbody { margin: 0; padding: 0; overflow-x: hidden; }\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n</script>\n</body>\n</html>`;

    // Provide fallback content if parsing failed
    const finalHtml = html || '<div class="p-8 text-center">HTML content not generated properly</div>';
    const finalCss = css || '/* CSS content not generated properly */\nbody { font-family: Arial, sans-serif; padding: 20px; }';
    const finalJs = js || '// JavaScript content not generated properly\nconsole.log("JavaScript not generated");';

    res.json({
      success: true,
      data: {
        html: fullHtml,
        htmlOnly: finalHtml,
        cssOnly: finalCss,
        jsOnly: finalJs,
        prompt: prompt,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating website:', error);
    res.status(500).json({ 
      error: 'Failed to generate website',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WebGenerator - AI Website Builder'
  });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:8080`);
  console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});