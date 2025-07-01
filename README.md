# WebGenerator - AI-Powered Website Builder 🚀

A modern, responsive web application that generates beautiful websites using AI. Built with React, TypeScript, and powered by Google's Gemini AI.

## ✨ Features

- 🤖 **AI-Powered Generation**: Uses Google Gemini AI to create complete websites
- 🎨 **Modern UI**: Beautiful, responsive design with dark/light themes
- 📱 **Mobile-First**: Fully responsive across all devices
- ⚡ **Real-time Preview**: See your generated website instantly
- 💾 **Export Functionality**: Download your websites as HTML files
- 🔄 **Live Preview**: Open generated websites in new tabs
- 📤 **Share Capabilities**: Share your creations easily

There are several ways of editing your application.

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Router** for navigation
- **React Query** for API management

### Backend
- **Node.js** with Express
- **Google Gemini AI** for website generation
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### 1. Clone and Install

```bash
# Navigate to the project directory
cd WebGenerator

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp env.example .env
```

Edit `.env` and add your Gemini API key:

```env
# Gemini AI API Key (Get from: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_actual_gemini_api_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

### 4. Start the Development Servers

```bash
# Start both frontend and backend
npm run dev:full
```

Or start them separately:

```bash
# Terminal 1: Start frontend (Vite dev server)
npm run dev

# Terminal 2: Start backend (Express server)
npm run server
```

### 5. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 📖 How to Use

1. **Describe Your Website**: Enter a detailed description of the website you want to create
2. **Generate**: Click "Generate Website" and wait for AI to create your site
3. **Preview**: View your generated website in the preview area
4. **Export**: Download your website as an HTML file
5. **Share**: Share your creation with others

### Example Prompts

- "A modern portfolio website for a photographer with dark aesthetic and smooth animations"
- "An e-commerce store for handmade jewelry with minimalist design and shopping cart"
- "A landing page for a SaaS startup with clean animations and call-to-action buttons"
- "A blog about sustainable living with nature-inspired layout and reading features"

## 🔧 API Endpoints

### Generate Website
```http
POST /api/generate-website
Content-Type: application/json

{
  "prompt": "Your website description here"
}
```

### Health Check
```http
GET /api/health
```

## 🏗️ Project Structure

```
lovable-echo-genesis-main/
├── src/
│   ├── components/          # React components
│   ├── lib/
│   │   └── api.ts          # API service utilities
│   ├── pages/              # Page components
│   └── hooks/              # Custom React hooks
├── server/
│   └── index.js            # Express server
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json           # Dependencies and scripts
```

## 🎨 Customization

### Styling
- Modify `src/index.css` for global styles
- Update Tailwind config in `tailwind.config.ts`
- Customize shadcn/ui theme in `components.json`

### AI Generation
- Adjust the prompt template in `server/index.js`
- Modify the Gemini model parameters
- Add additional generation options

## 🚀 Deployment

### Frontend (Vite)
```bash
npm run build
```

### Backend (Node.js)
```bash
npm run server
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=your_production_api_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Troubleshooting

### Common Issues

**"Gemini API key not configured"**
- Make sure your `.env` file exists and contains the correct API key
- Verify the API key is valid and has proper permissions

**"Failed to generate website"**
- Check your internet connection
- Verify the Gemini API key is working
- Check the browser console for detailed error messages

**"CORS errors"**
- Ensure the backend server is running on port 3001
- Check that the frontend is making requests to the correct URL

**"Port already in use"**
- Change the PORT in your `.env` file
- Kill any processes using the default ports

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your environment setup
4. Create an issue in the repository

---

**Happy Website Generating! 🎉**
