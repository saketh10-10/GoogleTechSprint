# Firebase Credentials Cleanup Script
# This script removes exposed Firebase credentials from git history

Write-Host "⚠️  FIREBASE CREDENTIALS CLEANUP" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red
Write-Host ""
Write-Host "BEFORE running this script:" -ForegroundColor Yellow
Write-Host "1. ✅ Revoke the API key in Google Cloud Console" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor Yellow
Write-Host "2. ✅ Generate new Firebase credentials" -ForegroundColor Yellow
Write-Host "3. ✅ Backup your repository (just in case)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Have you completed steps 1-3 above? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Aborting. Complete the steps above first!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 This script will:" -ForegroundColor Cyan
Write-Host "   1. Create a passwords.txt file with the exposed API key" -ForegroundColor Cyan
Write-Host "   2. Use BFG Repo-Cleaner to remove it from git history" -ForegroundColor Cyan
Write-Host "   3. Force push to remote (rewrites history)" -ForegroundColor Cyan
Write-Host ""

# Create passwords.txt for BFG
$exposedKey = "AIzaSyCjrREVpeKM9tmiu-Vd9EFuva-VK5PpsAk"
Set-Content -Path "passwords.txt" -Value $exposedKey

Write-Host "✅ Created passwords.txt" -ForegroundColor Green

# Check if BFG is installed
$bfgPath = "bfg.jar"
if (-not (Test-Path $bfgPath)) {
    Write-Host "📥 Downloading BFG Repo-Cleaner..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar" -OutFile "bfg.jar"
    Write-Host "✅ Downloaded BFG" -ForegroundColor Green
}

# Backup current state
Write-Host ""
Write-Host "💾 Creating backup branch..." -ForegroundColor Yellow
git branch backup-before-cleanup
Write-Host "✅ Backup branch created: backup-before-cleanup" -ForegroundColor Green

# Run BFG to replace passwords
Write-Host ""
Write-Host "🔄 Running BFG Repo-Cleaner..." -ForegroundColor Yellow
Write-Host "   This will replace your API key with ***REMOVED*** in all commits" -ForegroundColor Yellow
java -jar bfg.jar --replace-text passwords.txt

# Clean up repository
Write-Host ""
Write-Host "🧹 Cleaning up repository..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ Git history cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  FINAL STEP - Force Push to GitHub:" -ForegroundColor Red
Write-Host "   Run this command to update remote repository:" -ForegroundColor Yellow
Write-Host "   git push origin --force --all" -ForegroundColor Cyan
Write-Host ""
Write-Host "   WARNING: This rewrites public history!" -ForegroundColor Red
Write-Host "   If others have cloned your repo, they need to re-clone it." -ForegroundColor Red
Write-Host ""

# Clean up passwords.txt
Remove-Item "passwords.txt" -ErrorAction SilentlyContinue

Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
Write-Host "   1. Update .env.local with NEW credentials" -ForegroundColor Yellow
Write-Host "   2. Update all HTML files in public/ folder with new config" -ForegroundColor Yellow
Write-Host "   3. Never commit credentials again!" -ForegroundColor Yellow
