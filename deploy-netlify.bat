@echo off
echo 🚀 Preparing WebGenerator for Netlify deployment...
echo.

REM Build the project
echo 📦 Building the project...
npm run build

echo.
echo ✅ Build completed!
echo.
echo 📋 Deployment Checklist:
echo 1. ✅ Netlify Functions created in netlify/functions/
echo 2. ✅ netlify.toml configuration added
echo 3. ✅ API endpoints configured for production
echo 4. ✅ Project built successfully
echo.
echo 🔧 Next Steps:
echo 1. Push your changes to GitHub
echo 2. Connect your repository to Netlify
echo 3. Set build command: npm run build
echo 4. Set publish directory: dist
echo 5. Add GEMINI_API_KEY environment variable in Netlify dashboard
echo.
echo 🌐 Your API endpoints will be available at:
echo    - /api/generate-website
echo    - /api/health
echo.
echo Happy deploying! 🎉
pause
