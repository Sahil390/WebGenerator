@echo off
echo ====================================
echo AI Website Generator - Deployment Fix
echo ====================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/5] Verifying build output...
if not exist "dist" (
    echo ERROR: Build directory not found
    pause
    exit /b 1
)

echo.
echo [4/5] Copying debug files to build...
copy "debug-deployment.html" "dist\debug-deployment.html" >nul
if %errorlevel% neq 0 (
    echo WARNING: Could not copy debug file
)

echo.
echo [5/5] Build complete!
echo.
echo ====================================
echo DEPLOYMENT INSTRUCTIONS:
echo ====================================
echo.
echo 1. Upload the 'dist' folder to your Netlify site
echo 2. Make sure GEMINI_API_KEY is set in Netlify Environment Variables
echo 3. Visit https://your-site.netlify.app/debug-deployment.html to test
echo 4. If errors occur, check the browser console and network tab
echo.
echo Environment Variables needed in Netlify:
echo - GEMINI_API_KEY: Your Google AI API key
echo.
echo If you continue to have issues, check the Netlify function logs.
echo.
pause
