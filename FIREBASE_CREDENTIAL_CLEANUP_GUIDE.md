# 🔒 Firebase Configuration Setup Guide

## ⚠️ IMPORTANT: Complete These Steps Immediately

Your Firebase credentials were exposed in git history. Follow these steps **in order**:

---

## Step 1: Revoke Compromised Credentials (DO THIS FIRST!) 🚨

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Find and **DELETE** the exposed API key: `AIzaSyCjrREVpeKM9tmiu-Vd9EFuva-VK5PpsAk`
3. Generate a **NEW API key** with proper restrictions:
   - **Application restrictions**: HTTP referrers (websites)
   - **Add your domains**:
     - `https://yourdomain.com/*`
     - `https://*.yourdomain.com/*`
     - `http://localhost:*` (for development)
   - **API restrictions**: Only enable:
     - Firebase Authentication API
     - Cloud Firestore API
     - Firebase Functions API

---

## Step 2: Update Firebase Configuration 📝

### For Next.js Application (Recommended)

Create or update `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_new_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

✅ This file is already in `.gitignore` and won't be committed.

### For Static HTML Files (public/ folder)

Update `public/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_NEW_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

if (typeof window !== "undefined") {
  window.firebaseConfig = firebaseConfig;
}
```

✅ This file is now in `.gitignore` and won't be committed.

---

## Step 3: Clean Git History 🧹

Run the cleanup script to remove exposed credentials from git history:

```powershell
# Run the cleanup script (Windows PowerShell)
.\cleanup-credentials.ps1

# Follow the prompts and then force push
git push origin --force --all
```

⚠️ **Warning**: This rewrites git history. Team members will need to re-clone the repository.

---

## Step 4: Enable Firebase Security Features 🛡️

### A. Enable Firebase App Check

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project > **App Check**
3. Click **Get started**
4. For web apps, choose **reCAPTCHA v3**
5. Add your domains

### B. Review Firestore Security Rules

Ensure your rules don't allow unauthorized access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 5: Verify Setup ✅

### Test Next.js App:

```bash
npm run dev
```

Check that Firebase connects properly.

### Test Static HTML Files:

1. Open `public/auth/index.html` in a browser
2. Check browser console for Firebase initialization
3. Verify no credentials are visible in source code

---

## 📋 Files Changed

The following files now use external configuration:

### Next.js Application:

- ✅ `lib/firebase.ts` - Already using environment variables

### Static HTML Files (Updated):

- ✅ `public/firebase-config.js` - **NEW centralized config** (gitignored)
- ✅ `public/roomsync/allocations.html`
- ✅ `public/roomsync/sections.html`
- ✅ `public/roomsync/rooms.html`
- ✅ `public/roomsync/login.html`
- ✅ `public/roomsync/dashboard.html`
- ✅ `public/auth/auth.js`
- ✅ `public/auth/index.html`
- ✅ `public/attendance/qr.html`
- ✅ `public/attendance/scanner.html`
- ✅ `public/attendance/event.html`
- ✅ `public/attendance/dashboard.html`

### Security:

- ✅ `.gitignore` - Added `public/firebase-config.js`
- ✅ `cleanup-credentials.ps1` - Cleanup script created

---

## 🔍 Monitoring

After completing the cleanup:

1. **Monitor Firebase Usage**:

   - Check Firebase Console > Usage and billing
   - Look for unusual activity or spikes

2. **Review Authentication Logs**:

   - Firebase Console > Authentication > Users
   - Check for unauthorized sign-ins

3. **Check Firestore Activity**:
   - Monitor read/write operations
   - Review recent database changes

---

## 🚫 Prevention Checklist

- [x] Remove hardcoded credentials from all files
- [x] Move credentials to environment variables
- [x] Add credential files to `.gitignore`
- [ ] Run cleanup script and force push
- [ ] Enable Firebase App Check
- [ ] Restrict API keys in Google Cloud Console
- [ ] Set up git pre-commit hooks (optional)
- [ ] Enable GitHub secret scanning
- [ ] Notify team to re-clone repository

---

## 🆘 Need Help?

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Support**: https://firebase.google.com/support
- **Security Best Practices**: https://firebase.google.com/docs/rules/security

---

## 📞 Emergency Contacts

If you notice suspicious activity:

1. Immediately revoke ALL Firebase credentials
2. Check Firebase Console > Authentication for unauthorized users
3. Review Firestore for data breaches
4. Contact Firebase support if needed

---

**Remember**: Never commit credentials again! Always use environment variables or external config files that are gitignored.
