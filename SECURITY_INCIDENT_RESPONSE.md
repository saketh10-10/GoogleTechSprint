# 🚨 Firebase Credentials Exposure - Incident Response

**Date:** December 26, 2025  
**Status:** In Progress  
**Severity:** HIGH

## What Happened

Firebase API credentials were committed to GitHub in the following files:

- `public/roomsync/*.html` (5 files)
- `public/auth/auth.js`
- `public/attendance/*.html` (4 files)

**Exposed API Key:** `AIzaSyCjrREVpeKM9tmiu-Vd9EFuva-VK5PpsAk`

## ✅ Immediate Actions Required

### 1. Revoke Compromised Credentials (DO THIS FIRST!)

```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find the API key: AIzaSyCjrREVpeKM9tmiu-Vd9EFuva-VK5PpsAk
3. Click DELETE or REGENERATE
4. Generate a NEW API key with proper restrictions
```

### 2. Restrict New API Key

```
- Application restrictions: HTTP referrers (websites)
- Add your domains: https://yourdomain.com, https://*.yourdomain.com
- API restrictions: Enable only needed APIs (Firebase, Firestore)
```

### 3. Clean Git History

```powershell
# Run the cleanup script
.\cleanup-credentials.ps1

# After script completes, force push:
git push origin --force --all
```

### 4. Update All Files with New Credentials

Create `.env.local` with new credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_new_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Update HTML files in `public/` folder to use the template or move to environment variables.

## 🔐 Prevention Measures

### Git Hooks - Pre-commit Check

Add this to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Check for Firebase API keys
if git diff --cached | grep -E "AIzaSy[A-Za-z0-9_-]{33}"; then
    echo "❌ ERROR: Firebase API key detected!"
    echo "Remove credentials before committing."
    exit 1
fi
```

### Use GitHub Secret Scanning

- Enable secret scanning in repository settings
- GitHub will alert you of exposed credentials

### Firebase App Check

Enable Firebase App Check to restrict API access:

```
1. Go to Firebase Console > App Check
2. Enable for your app
3. Choose provider (reCAPTCHA for web)
```

## 📋 Checklist

- [ ] Revoked old API key in Google Cloud Console
- [ ] Generated new API key with restrictions
- [ ] Ran cleanup-credentials.ps1 script
- [ ] Force pushed to remote (git push --force)
- [ ] Updated .env.local with new credentials
- [ ] Updated HTML files in public/ folder
- [ ] Enabled Firebase App Check
- [ ] Set up git pre-commit hook
- [ ] Enabled GitHub secret scanning
- [ ] Notified team members to re-clone repository

## 🔍 Monitoring

After cleanup:

- Monitor Firebase usage for unusual activity
- Check Firebase Console > Usage and billing
- Review authentication logs
- Watch for unauthorized database access

## 📚 Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys)
- [Git History Cleanup](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

## Contact

If you notice suspicious activity:

1. Immediately revoke all credentials
2. Check Firebase Console > Authentication > Users
3. Review Firestore audit logs
4. Contact Firebase support if needed
