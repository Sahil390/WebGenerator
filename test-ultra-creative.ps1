#!/usr/bin/env pwsh

Write-Host "🎨 Testing Ultra-Creative Website Generation..." -ForegroundColor Cyan

# Test different creative prompts
$testPrompts = @(
    "Digital art gallery",
    "Gaming clan website", 
    "Music festival promotion",
    "Tech startup landing page",
    "Fashion brand showcase"
)

foreach ($prompt in $testPrompts) {
    Write-Host "`n🧪 Testing: $prompt" -ForegroundColor Yellow
    
    # Create test request
    $body = @{
        prompt = $prompt
    } | ConvertTo-Json
    
    try {
        # Test local server
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/generate-website" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 180
        
        if ($response.success) {
            Write-Host "✅ Generated successfully!" -ForegroundColor Green
            Write-Host "   HTML length: $($response.data.htmlOnly.Length)" -ForegroundColor Gray
            Write-Host "   CSS length: $($response.data.cssOnly.Length)" -ForegroundColor Gray
            Write-Host "   JS length: $($response.data.jsOnly.Length)" -ForegroundColor Gray
            
            # Check for creative elements
            $css = $response.data.cssOnly
            $hasAnimation = $css -match "@keyframes|animation:|transform:|transition:"
            $hasGradient = $css -match "linear-gradient|radial-gradient"
            $hasCreativeColors = $css -match "var\(--primary\)|var\(--secondary\)|var\(--accent\)"
            
            Write-Host "   Animations: $(if($hasAnimation) { '✓' } else { '✗' })" -ForegroundColor $(if($hasAnimation) { 'Green' } else { 'Red' })
            Write-Host "   Gradients: $(if($hasGradient) { '✓' } else { '✗' })" -ForegroundColor $(if($hasGradient) { 'Green' } else { 'Red' })
            Write-Host "   Creative Colors: $(if($hasCreativeColors) { '✓' } else { '✗' })" -ForegroundColor $(if($hasCreativeColors) { 'Green' } else { 'Red' })
        } else {
            Write-Host "❌ Generation failed: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Wait between requests
    Start-Sleep -Seconds 2
}

Write-Host "`n🎉 Ultra-Creative Testing Complete!" -ForegroundColor Cyan
