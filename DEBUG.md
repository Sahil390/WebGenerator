# 🐛 Debugging Guide for Netlify Deployment

## Step 1: Deploy with Enhanced Debugging
```bash
git add .
git commit -m "Add enhanced debugging and test endpoint"
git push origin main
```

## Step 2: Test the Functions
After deployment, test these URLs in your browser:

### Test Function (should work immediately):
```
https://yoursite.netlify.app/api/test
```
This will show you:
- ✅ If functions are working
- ✅ Environment variables status
- ✅ Node.js version
- ✅ Request details

### Health Check:
```
https://yoursite.netlify.app/api/health
```

## Step 3: Check Netlify Dashboard
1. Go to your Netlify site dashboard
2. Click **Functions** tab
3. Look for function logs and errors
4. Check **Deploy logs** for build issues

## Step 4: Verify Environment Variables
In Netlify dashboard:
1. **Site settings** → **Environment variables**
2. Verify `GEMINI_API_KEY` exists and starts with `AIza`
3. Make sure there are no extra spaces or quotes

## Step 5: Debug the Generate Function
Try generating a website and check:
1. **Browser Console** (F12) for frontend errors
2. **Netlify Function Logs** for backend errors
3. **Network tab** to see the actual API request/response

## Common Issues & Solutions:

### ❌ "Generation Failed"
- Check function logs in Netlify dashboard
- Verify GEMINI_API_KEY is set correctly
- Try the /api/test endpoint first

### ❌ "Function not found" 
- Check if netlify.toml is in project root
- Verify functions are in netlify/functions/ folder
- Redeploy after checking

### ❌ "CORS errors"
- Functions should handle CORS automatically
- Check if API calls are going to correct endpoints

## Debugging Steps:
1. Test `/api/test` - Should show environment info
2. Test `/api/health` - Should return healthy status  
3. Try website generation with simple prompt
4. Check all logs in Netlify dashboard

## Contact Support:
If issues persist, share:
- Your Netlify site URL
- Function logs from dashboard
- Browser console errors
- The test endpoint response
