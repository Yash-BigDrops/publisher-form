# Security Headers Check Script (PowerShell)
# Usage: .\scripts\check-headers.ps1 [URL]

param(
    [string]$Url = "http://localhost:3000"
)

Write-Host "Checking security headers for: $Url" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Function to check header
function Test-SecurityHeader {
    param(
        [string]$HeaderName,
        [string]$ExpectedValue,
        [string]$Description
    )
    
    Write-Host "Checking $HeaderName... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -ErrorAction Stop
        $headerValue = $response.Headers[$HeaderName]
        
        if ($headerValue) {
            Write-Host "✓ Found: $headerValue" -ForegroundColor Green
            if ($ExpectedValue -and $headerValue -like "*$ExpectedValue*") {
                Write-Host "  ✓ Contains expected value: $ExpectedValue" -ForegroundColor Green
            } elseif ($ExpectedValue) {
                Write-Host "  ⚠ Missing expected value: $ExpectedValue" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ Missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Check security headers
Test-SecurityHeader -HeaderName "Strict-Transport-Security" -ExpectedValue "max-age" -Description "HSTS header"
Test-SecurityHeader -HeaderName "X-Frame-Options" -ExpectedValue "DENY" -Description "Clickjacking protection"
Test-SecurityHeader -HeaderName "X-Content-Type-Options" -ExpectedValue "nosniff" -Description "MIME sniffing protection"
Test-SecurityHeader -HeaderName "Referrer-Policy" -ExpectedValue "strict-origin-when-cross-origin" -Description "Referrer policy"
Test-SecurityHeader -HeaderName "Permissions-Policy" -ExpectedValue "camera=()" -Description "Permissions policy"
Test-SecurityHeader -HeaderName "Content-Security-Policy" -ExpectedValue "" -Description "Content Security Policy"

Write-Host "==================================" -ForegroundColor Green
Write-Host "Header check complete!" -ForegroundColor Green

# Additional checks
Write-Host ""
Write-Host "Additional checks:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# Check if HTTPS redirect works
if ($Url -like "http://*") {
    Write-Host "Checking HTTPS redirect... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -MaximumRedirection 0 -ErrorAction Stop
        if ($response.StatusCode -eq 301 -or $response.StatusCode -eq 308) {
            $redirectUrl = $response.Headers.Location
            if ($redirectUrl -like "https://*") {
                Write-Host "✓ Redirects to HTTPS: $redirectUrl" -ForegroundColor Green
            } else {
                Write-Host "✗ No HTTPS redirect found" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ No redirect found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check for server information disclosure
Write-Host "Checking server header... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri $Url -Method Head -ErrorAction Stop
    $serverHeader = $response.Headers.Server
    
    if ($serverHeader) {
        Write-Host "Found: $serverHeader" -ForegroundColor Yellow
        if ($serverHeader -like "*nginx*" -or $serverHeader -like "*apache*") {
            Write-Host "  ⚠ Consider hiding server information" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ Server information is minimal" -ForegroundColor Green
        }
    } else {
        Write-Host "✓ No server header disclosed" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
