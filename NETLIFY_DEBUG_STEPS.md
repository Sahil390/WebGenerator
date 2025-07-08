# Netlify Deployment Debug Checklist

## Step 1: Deploy and Test Functions

After deploying, test these endpoints in order:

### 1. Health Check
```
GET https://your-site.netlify.app/api/health
```
**Expected**: `{"status":"healthy","timestamp":"...","service":"WebGenerator API"}`

### 2. Debug Info
```
GET https://your-site.netlify.app/api/debug
```
**Expected**: Should show `hasGeminiKey: true` and key length ~39 characters

### 3. Test Generation
```
POST https://your-site.netlify.app/api/test-generate
Content-Type: application/json

{}
```
**Expected**: Should show successful AI initialization and simple generation test

### 4. Full Generation
```
POST https://your-site.netlify.app/api/generate-website
Content-Type: application/json

{"prompt": "a simple hello world page"}
```

## Step 2: Check Netlify Function Logs

1. Go to your Netlify dashboard
2. Navigate to Functions tab
3. Click on the function that's failing
4. Check the logs for specific error messages

## Step 3: Common Issues & Solutions

### Issue: "Function not found" (404)
**Cause**: Function not deployed properly
**Solution**: 
- Check that `netlify/functions/` directory exists in your repo
- Redeploy the site
- Check build logs for any errors

### Issue: "GEMINI_API_KEY not configured"
**Cause**: Environment variable not set
**Solution**:
- Go to Site settings → Environment variables
- Add `GEMINI_API_KEY` with your actual key
- Redeploy after setting

### Issue: "AI initialization failed"
**Cause**: Invalid API key or network issues
**Solution**:
- Verify API key is correct (starts with "AI..." and ~39 chars)
- Check if key has proper permissions
- Try regenerating the API key

### Issue: "Request timeout"
**Cause**: Function taking too long
**Solution**:
- Try with shorter prompts
- Check if it's a rate limiting issue
- Look for specific timeout location in logs

### Issue: "Package not found" or module errors
**Cause**: Dependencies not installed in functions
**Solution**:
- Check `netlify/functions/package.json` exists
- Verify `@google/generative-ai` is listed
- Redeploy to reinstall dependencies

## Step 4: Test Locally vs Netlify

### Local Test (should work):
```bash
cd "d:\hackathon 3\hackathon 3\WebGenerator"
npm run dev
# Test at http://localhost:8080
```

### Netlify Test Sequence:
1. `/api/health` - Basic function check
2. `/api/debug` - Environment check  
3. `/api/test-generate` - AI initialization check
4. `/api/generate-website` - Full generation

## Step 5: Environment Variables Checklist

In Netlify dashboard → Site settings → Environment variables:
- [ ] `GEMINI_API_KEY` is set
- [ ] Key starts with "AI..."
- [ ] Key is approximately 39 characters long
- [ ] No extra spaces or quotes around the key

## Step 6: Build Process Check

Your `package.json` should have:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

And `netlify.toml` should have:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[functions]
  directory = "netlify/functions"
```

## Step 7: If Still Failing

1. **Check specific error in function logs**
2. **Try the test-generate endpoint first**
3. **Verify API key works in Google AI Studio**
4. **Check if there are any build errors**
5. **Try a minimal prompt first**

## Debug Commands

Test locally:
```bash
# Test the function syntax
node -e "try { require('./netlify/functions/generate-website.js'); console.log('✅ OK'); } catch(e) { console.error('❌', e.message); }"

# Build project
npm run build
```

The enhanced logging will now show exactly where the failure occurs!
