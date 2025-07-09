# Creative Diversity Test

$headers = @{
    "Content-Type" = "application/json"
}

$testPrompts = @(
    "Create a gaming website for esports tournaments",
    "Create a food blog with recipes and cooking tips",
    "Create a minimalist portfolio for a photographer",
    "Create a vibrant website for a music festival",
    "Create a tech startup landing page",
    "Create a wellness and meditation app website"
)

Write-Host "Testing Creative Diversity and Modern Design..."
Write-Host "=" * 60

foreach ($prompt in $testPrompts) {
    Write-Host "`n🎨 Testing: $prompt"
    Write-Host "Starting at: $(Get-Date)"
    
    $body = @{
        prompt = $prompt
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/generate-website" -Method POST -Headers $headers -Body $body
        
        if ($response.StatusCode -eq 200) {
            $responseData = $response.Content | ConvertFrom-Json
            
            if ($responseData.success) {
                Write-Host "✅ SUCCESS!" -ForegroundColor Green
                Write-Host "HTML: $($responseData.data.htmlOnly.Length) chars" -ForegroundColor Cyan
                Write-Host "CSS: $($responseData.data.cssOnly.Length) chars" -ForegroundColor Cyan
                Write-Host "JS: $($responseData.data.jsOnly.Length) chars" -ForegroundColor Cyan
                
                # Check for creative elements
                $htmlContent = $responseData.data.htmlOnly
                $cssContent = $responseData.data.cssOnly
                $jsContent = $responseData.data.jsOnly
                
                Write-Host "🎭 Creative Elements Check:" -ForegroundColor Yellow
                
                # Check for diverse structure
                if ($htmlContent -match "main-wrapper|hero-section|creative|unique") {
                    Write-Host "  ✅ Creative HTML structure" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ Generic HTML structure" -ForegroundColor Red
                }
                
                # Check for modern CSS
                if ($cssContent -match "animation|transform|gradient|backdrop-filter|clamp|var\(--") {
                    Write-Host "  ✅ Modern CSS features" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ Basic CSS" -ForegroundColor Red
                }
                
                # Check for interactive JS
                if ($jsContent -match "addEventListener|animation|interaction|dynamic|particle") {
                    Write-Host "  ✅ Interactive JavaScript" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ Static JavaScript" -ForegroundColor Red
                }
                
                # Check for unique colors (not just blue/purple)
                if ($cssContent -match "#ff6b6b|#4ecdc4|#a8e6cf|#ffd3a5|#ffeaa7|#74b9ff" -or $cssContent -match "var\(--primary\)|var\(--secondary\)") {
                    Write-Host "  ✅ Diverse color scheme" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ Repetitive colors" -ForegroundColor Red
                }
                
            } else {
                Write-Host "❌ Generation failed: $($responseData.error)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ HTTP Error: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "Completed at: $(Get-Date)"
    Write-Host "-" * 50
    Start-Sleep -Seconds 2
}

Write-Host "`n🎉 Creative diversity test completed!"
Write-Host "Check the results above for uniqueness and modern design features."
