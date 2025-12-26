# Firebase Configuration Verification Script

Write-Host "🔍 Firebase Configuration Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Verify firebase-config.js exists
Write-Host "1. Checking if firebase-config.js exists..." -ForegroundColor Yellow
if (Test-Path "public/firebase-config.js") {
    Write-Host "   ✅ firebase-config.js exists" -ForegroundColor Green
    
    # Check if it contains placeholder values
    $content = Get-Content "public/firebase-config.js" -Raw
    if ($content -match "YOUR_NEW_API_KEY_HERE" -or $content -match "YOUR_API_KEY_HERE") {
        Write-Host "   ⚠️  WARNING: Still contains placeholder values!" -ForegroundColor Yellow
        Write-Host "   → Update with your new Firebase credentials" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Contains custom configuration" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ firebase-config.js NOT FOUND!" -ForegroundColor Red
}

Write-Host ""

# Check 2: Verify it's in .gitignore
Write-Host "2. Checking if firebase-config.js is in .gitignore..." -ForegroundColor Yellow
$gitignoreCheck = git check-ignore -v public/firebase-config.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ firebase-config.js is properly ignored by git" -ForegroundColor Green
} else {
    Write-Host "   ❌ firebase-config.js is NOT in .gitignore!" -ForegroundColor Red
    Write-Host "   → Add it to .gitignore immediately" -ForegroundColor Red
}

Write-Host ""

# Check 3: Verify .env.local exists
Write-Host "3. Checking for .env.local file..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
    
    # Check if it contains Firebase config
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_FIREBASE_API_KEY") {
        Write-Host "   ✅ Contains Firebase configuration" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No Firebase configuration found" -ForegroundColor Yellow
        Write-Host "   → Add Firebase environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  .env.local does not exist" -ForegroundColor Yellow
    Write-Host "   → Create it from .env.example if needed" -ForegroundColor Yellow
}

Write-Host ""

# Check 4: Search for exposed credentials in tracked files
Write-Host "4. Searching for exposed API keys in tracked files..." -ForegroundColor Yellow
$exposedKey = "AIzaSyCjrREVpeKM9tmiu-Vd9EFuva-VK5PpsAk"
$searchResult = git grep -n "$exposedKey" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ❌ EXPOSED API KEY STILL FOUND!" -ForegroundColor Red
    Write-Host "   → Files containing exposed key:" -ForegroundColor Red
    Write-Host $searchResult -ForegroundColor Red
} else {
    Write-Host "   ✅ No exposed API keys found in tracked files" -ForegroundColor Green
}

Write-Host ""

# Check 5: Verify HTML files are updated
Write-Host "5. Checking if HTML files reference firebase-config.js..." -ForegroundColor Yellow
$htmlFiles = @(
    "public/roomsync/allocations.html",
    "public/roomsync/sections.html",
    "public/roomsync/rooms.html",
    "public/auth/index.html"
)

$allGood = $true
foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "firebase-config\.js") {
            Write-Host "   ✅ $file references firebase-config.js" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $file does NOT reference firebase-config.js" -ForegroundColor Red
            $allGood = $false
        }
    }
}

if ($allGood) {
    Write-Host "   ✅ All checked HTML files are updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update public/firebase-config.js with NEW credentials" -ForegroundColor White
Write-Host "2. Update .env.local with NEW credentials" -ForegroundColor White
Write-Host "3. Run cleanup-credentials.ps1 to remove old keys from git history" -ForegroundColor White
Write-Host "4. Force push: git push origin --force --all" -ForegroundColor White
Write-Host ""
Write-Host "See FIREBASE_CREDENTIAL_CLEANUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
