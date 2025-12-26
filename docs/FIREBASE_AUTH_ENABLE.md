# Firebase Authentication Setup Guide

## Error: `auth/configuration-not-found`

This error occurs when Firebase Authentication is not enabled in your Firebase project.

## 🔧 How to Fix

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **edusync-78dbe**

### Step 2: Enable Email/Password Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get Started** (if you haven't used Authentication before)
3. Go to the **Sign-in method** tab
4. Find **Email/Password** in the list of providers
5. Click on **Email/Password**
6. Toggle the **Enable** switch to ON
7. Click **Save**

### Step 3: Verify Configuration

Your app should now work! The authentication system will:

- ✅ Allow user login with email/password
- ✅ Auto-create accounts for new users
- ✅ Store user data in Firestore

## 📝 Notes

- **Student Login Format**: Roll number is converted to email format
  - Example: `2410030001` → `2410030001@klh.student`
- **Faculty Login Format**: Direct email address
  - Example: `faculty@klh.edu.in`

## 🚀 After Enabling

Once Email/Password authentication is enabled:

1. Restart your Next.js dev server
2. Try logging in again
3. The error should be resolved!

## ⚠️ Common Issues

### "Too many requests"

- Wait a few minutes before trying again
- Firebase has rate limits on authentication

### "Invalid credentials"

- For new users, the system will auto-create accounts
- Make sure password is at least 6 characters

### "Network error"

- Check your internet connection
- Check if Firebase project is active

## 📚 Additional Setup (Optional)

### Enable Additional Features:

1. **Email Verification**: Sign-in method → Email/Password → Enable email verification
2. **Password Recovery**: Automatically enabled with Email/Password
3. **Multi-factor Authentication**: Available in Authentication settings

---

**Project**: edusync-78dbe  
**Auth Domain**: edusync-78dbe.firebaseapp.com
