# 🔧 Firebase Authentication Setup Guide

## 🚨 Issue: Invalid Firebase API Key

The current Firebase API key is invalid. You need to create a new Firebase project and configure it properly.

## 📋 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or select existing project)
3. Enter project name: `your-project-name`
4. Follow the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. Toggle **"Enable"** switch
6. Click **"Save"**

### Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click **"Add app"** → **"</>"** (Web app)
4. Enter app nickname: `GoogleTechSprint`
5. **Copy the configuration object** - you'll need these values

### Step 4: Configure Your Project

#### Option A: Run Setup Script (Recommended)

```bash
node setup-firebase.js
```

This will prompt you for each configuration value and update all files automatically.

#### Option B: Manual Configuration

Update `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 5: Create Test Users

1. In Firebase Console, go to **Authentication > Users**
2. Click **"Add user"**
3. Create these test accounts:

**Student Account:**
- Email: `2410030001@klh.student`
- Password: `Student@123`

**Faculty Account:**
- Email: `faculty@klh.edu.in`
- Password: `Faculty@123`

### Step 6: Test Authentication

1. Start the development server:
```bash
npm run dev
```

2. Test authentication at:
- **Main App**: http://localhost:3000/login
- **Test Page**: http://localhost:3000/test-firebase.html

## 🔍 Troubleshooting

### Still getting API key errors?

1. **Verify API key**: Check Firebase Console → Project Settings → General → Your apps
2. **Check project exists**: Make sure the project wasn't deleted
3. **Browser cache**: Clear browser cache and reload
4. **Environment variables**: Restart the development server after updating `.env.local`

### Authentication not working?

1. **Enable Email/Password**: Firebase Console → Authentication → Sign-in method
2. **User exists**: Check Firebase Console → Authentication → Users
3. **Password correct**: Try resetting password if unsure
4. **Network issues**: Check browser console for network errors

## 📞 Need Help?

If you continue having issues:

1. Check browser console for specific error messages
2. Verify all configuration values are correct
3. Ensure Firebase project is active and not suspended
4. Try creating a new Firebase project from scratch

## 🚀 Quick Start (For Experienced Users)

```bash
# 1. Create Firebase project at console.firebase.google.com
# 2. Enable Authentication > Email/Password
# 3. Run setup script
node setup-firebase.js
# 4. Create test users in Firebase Console
# 5. Start development server
npm run dev
# 6. Test at http://localhost:3000/login
```
