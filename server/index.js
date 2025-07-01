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

dotenv.config();

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

    // Ultra-specific prompt that forces complete HTML/CSS generation
    const enhancedPrompt = `
You are a professional web developer. Create a COMPLETE, WORKING website based on: "${prompt}"

CRITICAL: You MUST return a SINGLE HTML file with ALL CSS and JavaScript embedded inside. The file must be COMPLETE and WORKING.

REQUIRED HTML STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Title</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* ALL CSS GOES HERE */
    </style>
</head>
<body>
    <!-- ALL HTML CONTENT GOES HERE -->
    <script>
        /* ALL JAVASCRIPT GOES HERE */
    </script>
</body>
</html>

MANDATORY CSS REQUIREMENTS:
1. CSS Variables for colors:
   :root {
     --primary: #2563eb;
     --secondary: #64748b;
     --accent: #f59e0b;
     --background: #ffffff;
     --text: #1e293b;
     --gray-100: #f1f5f9;
     --gray-200: #e2e8f0;
     --gray-300: #cbd5e1;
   }

2. Typography:
   body { font-family: 'Inter', sans-serif; line-height: 1.6; }
   h1, h2, h3 { font-family: 'Poppins', sans-serif; font-weight: 600; }
   h1 { font-size: 3rem; margin-bottom: 1rem; }
   h2 { font-size: 2.5rem; margin-bottom: 0.8rem; }
   h3 { font-size: 2rem; margin-bottom: 0.6rem; }

3. Layout:
   .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
   .section { padding: 4rem 0; }
   .grid { display: grid; gap: 2rem; }
   .flex { display: flex; align-items: center; }

4. Responsive:
   @media (max-width: 768px) { /* Mobile styles */ }
   @media (min-width: 769px) { /* Desktop styles */ }

5. Interactive Elements:
   .btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; transition: all 0.3s ease; }
   .card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 2rem; }

CONTENT REQUIREMENTS:
- Generate REAL, PROFESSIONAL content (not lorem ipsum)
- Create compelling headlines and descriptions
- Add realistic testimonials, project details, and bios
- Include relevant industry-specific information
- Write authentic, engaging copy

DESIGN REQUIREMENTS:
- Modern, professional color scheme
- Clean typography with proper hierarchy
- Smooth animations and hover effects
- Professional spacing and layout
- Mobile-responsive design
- Modern card designs and shadows

FUNCTIONALITY REQUIREMENTS:
- Working navigation with smooth scrolling
- Contact forms with validation
- Interactive buttons and links
- Hover effects on all interactive elements
- Mobile menu functionality

EXAMPLE SECTIONS TO INCLUDE:
- Hero section with compelling headline
- About/Features section
- Services/Portfolio section
- Testimonials section
- Contact section with form
- Footer with social links

IMPORTANT RULES:
1. Return ONLY the complete HTML file
2. Include ALL CSS in <style> tags
3. Include ALL JavaScript in <script> tags
4. Make it a SINGLE, COMPLETE file
5. Ensure it works immediately when opened
6. Use Google Fonts and Font Awesome icons
7. Make it mobile-responsive
8. Include real content, not placeholder text

Create a PROFESSIONAL, PRODUCTION-READY website that looks like it was built by an expert web developer. The website should be complete, functional, and visually appealing.
`;

    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const generatedHTML = response.text();

    // Clean up the response (remove markdown formatting if any)
    let cleanHTML = generatedHTML;
    if (cleanHTML.includes('```html')) {
      cleanHTML = cleanHTML.split('```html')[1]?.split('```')[0] || cleanHTML;
    }
    if (cleanHTML.includes('```')) {
      cleanHTML = cleanHTML.split('```')[1] || cleanHTML;
    }

    // Extract title from the generated HTML
    const titleMatch = cleanHTML.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Generated Website';

    // Extract description from meta tags or generate one
    const descMatch = cleanHTML.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1] : `AI-generated website based on: ${prompt}`;

    res.json({
      success: true,
      data: {
        html: cleanHTML,
        title: title,
        description: description,
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