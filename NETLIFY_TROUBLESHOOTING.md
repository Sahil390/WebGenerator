# Netlify Deployment Troubleshooting Guide

## ✅ Files Fixed:
1. **`generate-website.js`** - Restored with proper function code
2. **`debug.js`** - Added for debugging deployment issues
3. **`netlify.toml`** - Updated with debug function timeout
4. **Model updated** - Changed to `gemini-1.5-flash` for better compatibility

## 🔧 Next Steps for Deployment:

### 1. **Check Your Environment Variables**
In your Netlify dashboard:
- Go to Site settings → Environment variables
- Ensure `GEMINI_API_KEY` is set with your actual API key
- The key should start with "AI..." and be about 39 characters long

### 2. **Test the Debug Function**
After deployment, test this URL:
```
https://your-site.netlify.app/api/debug
```
This will show you:
- If your API key is configured
- Node.js version
- Memory limits
- Function environment

### 3. **Check Function Logs**
In Netlify dashboard:
- Go to Functions tab
- Click on `generate-website`
- Check the logs for any errors

### 4. **Common Issues & Solutions**

#### Issue: "Function not found" or 404 errors
**Solution**: 
- Redeploy the site completely
- Check that `netlify/functions/` directory is in your repository
- Verify `netlify.toml` redirects are correct

#### Issue: "API key not configured"
**Solution**:
- Double-check the environment variable name is exactly `GEMINI_API_KEY`
- Redeploy after setting environment variables

#### Issue: "Timeout errors"
**Solution**:
- The function timeout is set to 300 seconds (5 minutes)
- Try with shorter, simpler prompts first
- Check Netlify function logs for specific timeout locations

#### Issue: "Memory errors"
**Solution**:
- Function memory is set to 1024 MB
- The function includes memory cleanup code
- Try shorter prompts to reduce memory usage

### 5. **Test URLs After Deployment**
- Health check: `https://your-site.netlify.app/api/health`
- Debug info: `https://your-site.netlify.app/api/debug`
- Main function: `https://your-site.netlify.app/api/generate-website` (POST)

### 6. **Function Differences from Local**
- **Local**: Uses your local server on port 3001
- **Netlify**: Uses serverless functions with different environment
- **Timeout**: Netlify has stricter timeout limits
- **Memory**: Netlify has memory limits (1024 MB set)

### 7. **If Still Not Working**
1. Check browser console for specific error messages
2. Check Netlify function logs
3. Try the debug endpoint first
4. Verify API key is working by testing it locally

## 🚀 Deploy Command:
```bash
npm run build
```
Then push to your repository or use Netlify CLI:
```bash
netlify deploy --prod
```

## 📊 Expected Response Format:
```json
{
  "success": true,
  "data": {
    "html": "<!DOCTYPE html>...",
    "htmlOnly": "<div>...</div>",
    "cssOnly": "/* styles */",
    "jsOnly": "// javascript",
    "title": "Generated Website",
    "description": "Generated website for: [prompt]",
    "prompt": "[original prompt]",
    "generatedAt": "2025-01-08T..."
  }
}
```

## 🔍 Debug Checklist:
- [ ] Environment variable `GEMINI_API_KEY` is set
- [ ] Function builds without errors
- [ ] `/api/health` endpoint works
- [ ] `/api/debug` endpoint shows correct info
- [ ] Function logs show no errors
- [ ] Browser console shows no network errors
