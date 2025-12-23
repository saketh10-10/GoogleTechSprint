# RoomSync - Quick Setup Guide

## 🚀 5-Minute Setup

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Google Gemini API key

---

## Step 1: Firebase Project Setup (2 minutes)

### A. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name: "KLH-RoomSync"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### B. Enable Services

**Authentication:**

1. Go to Authentication > Sign-in method
2. Enable "Email/Password"
3. Save

**Firestore:**

1. Go to Firestore Database
2. Click "Create Database"
3. Select "Production mode"
4. Choose location (closest to your region)
5. Click "Enable"

**Functions:**

1. Go to Functions
2. Click "Get Started"
3. Upgrade to Blaze plan (pay-as-you-go, free tier available)

**Hosting:**

1. Go to Hosting
2. Click "Get Started"
3. Follow the wizard

---

## Step 2: Get Firebase Config (1 minute)

1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps"
3. Click Web icon (</>) to add web app
4. Name: "RoomSync Web"
5. Check "Also set up Firebase Hosting"
6. Register app
7. **Copy the firebaseConfig object**

It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc123",
};
```

---

## Step 3: Get Gemini API Key (1 minute)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Select your Firebase project (or create new)
5. **Copy the API key** (starts with AIza...)

---

## Step 4: Update Configuration (1 minute)

### A. Update Frontend Files

Replace `firebaseConfig` in these files:

- `public/roomsync/dashboard.html` (line ~85)
- `public/roomsync/rooms.html` (line ~291)
- `public/roomsync/sections.html` (line ~259)
- `public/roomsync/allocations.html` (line ~357)

**Find:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  // ...
};
```

**Replace with your copied config**

### B. Set Gemini API Key

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

---

## Step 5: Deploy (1 minute)

### A. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### B. Login to Firebase

```bash
firebase login
```

### C. Deploy Everything

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Install and deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions

# Deploy frontend
firebase deploy --only hosting
```

Wait for deployment to complete (~2-3 minutes).

---

## Step 6: Create Admin User

### A. Create User in Authentication

1. Go to Firebase Console > Authentication
2. Click "Add User"
3. Email: `admin@klh.edu` (or your email)
4. Password: (set strong password)
5. Click "Add User"
6. **Copy the User UID** (long string like: abc123def456...)

### B. Create User Document in Firestore

1. Go to Firestore Database
2. Click "Start Collection"
3. Collection ID: `users`
4. Document ID: **Paste the User UID copied above**
5. Add fields:
   - `email` (string): `admin@klh.edu`
   - `role` (string): `admin`
   - `createdAt` (timestamp): Click clock icon
6. Click "Save"

---

## Step 7: Access the System

1. Get your hosting URL:

```bash
firebase open hosting:site
```

2. Navigate to: `https://your-app.web.app/roomsync/dashboard.html`

3. **Login with:**
   - Email: `admin@klh.edu`
   - Password: (password you set)

---

## ✅ Quick Test

### Test 1: Create a Room

1. Click "Rooms" in navigation
2. Click "➕ Add New Room"
3. Fill in:
   - Room Name: Main Hall
   - Room Number: R-101
   - Capacity: 50
   - Type: Classroom
   - Status: Available
4. Click "Save Room"
5. ✓ Verify room appears in list

### Test 2: Create a Section

1. Click "Sections" in navigation
2. Click "➕ Add New Section"
3. Fill in:
   - Section Name: CSE-A1
   - Department: Computer Science
   - Class Strength: 45
   - Duration: 1 hour
   - Time Slot: 9:00 AM - 10:00 AM
   - Room Type: Classroom
4. Click "Save Section"
5. ✓ Verify section appears in list

### Test 3: AI Room Allocation

1. Click "Allocations" in navigation
2. Click "🤖 Create New Allocation"
3. Select section: CSE-A1
4. Enter tomorrow's date
5. Time: 9:00 AM - 10:00 AM
6. Duration: 1
7. Click "🤖 Get AI Suggestions"
8. ✓ Wait for AI suggestions (~5 seconds)
9. ✓ Verify 3 suggestions appear with reasoning
10. Click "Select This Room" on top suggestion
11. Click "✓ Confirm Allocation"
12. ✓ Verify success message

---

## 🎯 Next Steps

### Add More Users

**Faculty User:**

```javascript
// In Authentication
Email: faculty@klh.edu
Password: (set password)

// In Firestore users collection
{
  uid: "faculty-uid",
  email: "faculty@klh.edu",
  role: "faculty",
  createdAt: Timestamp
}
```

**Student (Blocked):**

```javascript
// In Firestore users collection
{
  uid: "student-uid",
  email: "student@klh.edu",
  role: "student", // Will be DENIED access
  createdAt: Timestamp
}
```

### Add Sample Data

**More Rooms:**

- Lab-101 (Capacity: 30, Type: lab)
- Seminar Hall (Capacity: 100, Type: seminar hall)
- Classroom-201 (Capacity: 60, Type: classroom)

**More Sections:**

- ECE-B1 (Electronics, 50 students)
- MECH-A2 (Mechanical, 55 students)
- CSE-B2 (Computer Science, 40 students)

---

## 🐛 Troubleshooting

### "Permission Denied" Error

**Cause**: User role not set in Firestore
**Fix**:

1. Go to Firestore > users collection
2. Find user document (use UID as document ID)
3. Verify `role` field = `admin` or `faculty`

### "Function not found" Error

**Cause**: Cloud Functions not deployed
**Fix**:

```bash
firebase deploy --only functions
```

### AI Suggestions Not Working

**Cause**: Gemini API key not set
**Fix**:

```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase deploy --only functions
```

Check current config:

```bash
firebase functions:config:get
```

### Modal Doesn't Open

**Cause**: JavaScript error in console
**Fix**: Open browser DevTools (F12) and check Console tab

### Rooms Not Loading

**Cause**: Firestore rules not deployed
**Fix**:

```bash
firebase deploy --only firestore:rules
```

---

## 📞 Support Commands

**View Logs:**

```bash
firebase functions:log
```

**View Firestore Rules:**

```bash
firebase firestore:rules get
```

**Check Deployment Status:**

```bash
firebase hosting:channel:list
```

**Clear Functions Config:**

```bash
firebase functions:config:unset gemini
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change default admin email
- [ ] Use strong passwords
- [ ] Enable 2FA for admin accounts
- [ ] Set up API key restrictions in Google Cloud Console
- [ ] Enable Firebase App Check
- [ ] Review Firestore security rules
- [ ] Set up monitoring alerts
- [ ] Test student access blocking
- [ ] Verify RBAC works correctly

---

## 📚 Documentation

Full documentation: `ROOMSYNC_DOCUMENTATION.md`

Key sections:

- Architecture overview
- Data models
- Security implementation
- API reference
- Testing guide
- Performance optimization

---

## ✨ Features Summary

✅ **RBAC**: Faculty/Admin only, Students blocked  
✅ **AI-Powered**: Gemini API room suggestions  
✅ **Conflict Prevention**: Time slot validation  
✅ **Real-time**: Live availability updates  
✅ **Responsive**: Works on all devices  
✅ **Secure**: Multi-layer security  
✅ **Audit Trail**: Complete allocation history

---

**System Status**: ✅ Ready for Production  
**Setup Time**: ~5 minutes  
**No Framework**: Pure HTML/CSS/JavaScript

**Enjoy your AI-powered Room Allocation System! 🎉**
