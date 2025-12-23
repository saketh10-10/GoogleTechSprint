# Firebase Authentication Setup Guide

## Error: `auth/configuration-not-found`

This error means Firebase Authentication is not enabled in your Firebase project. Follow these steps:

## Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **edusync-6927a**
3. Click on **Authentication** in the left sidebar
4. Click **Get Started** button
5. Go to **Sign-in method** tab
6. Click on **Email/Password**
7. Toggle **Enable** switch
8. Click **Save**

## Step 2: Create Test Users

### Create a Student User:

1. In Firebase Console > Authentication > Users
2. Click **Add user**
3. Email: `2410030001@klh.student`
4. Password: `Student@123` (or your choice)
5. Click **Add user**
6. Copy the User UID

### Create Student Profile in Firestore:

1. Go to Firestore Database
2. Create collection: `users`
3. Add document with the copied UID
4. Add fields:
   - `email`: `2410030001@klh.student`
   - `role`: `student`
   - `rollNumber`: `2410030001`
   - `createdAt`: (timestamp - use server timestamp)

### Create a Faculty User:

1. In Firebase Console > Authentication > Users
2. Click **Add user**
3. Email: `faculty@klh.edu.in`
4. Password: `Faculty@123` (or your choice)
5. Click **Add user**
6. Copy the User UID

### Create Faculty Profile in Firestore:

1. Go to Firestore Database > users collection
2. Add document with the copied UID
3. Add fields:
   - `email`: `faculty@klh.edu.in`
   - `role`: `faculty`
   - `createdAt`: (timestamp - use server timestamp)

## Step 3: Test Login

### Student Login:

- URL: `http://localhost:3000/auth/index.html`
- Click **Student Login** tab
- Roll Number: `2410030001`
- Password: `Student@123`
- Should redirect to: IssueHub (Student Dashboard)

### Faculty Login:

- URL: `http://localhost:3000/auth/index.html` or `http://localhost:3000/roomsync/login.html`
- Click **Faculty Login** tab
- Email: `faculty@klh.edu.in`
- Password: `Faculty@123`
- Should redirect to: RoomSync Dashboard

## Two Login Pages Available:

1. **Unified Login** (Recommended): `/auth/index.html`

   - Has tabs for both Student and Faculty
   - Clean, modern UI
   - Proper role validation

2. **RoomSync Login**: `/roomsync/login.html`
   - Also has Student/Faculty tabs
   - RoomSync branded
   - Same functionality

## Important Notes:

- Student emails follow format: `{rollNumber}@klh.student`
- Faculty emails use actual email addresses
- Both login methods check Firestore for role validation
- Students are redirected to IssueHub
- Faculty/Admin are redirected to RoomSync Dashboard
- Cross-portal access is blocked (student can't access faculty portal and vice versa)

## Troubleshooting:

### Still getting auth/configuration-not-found?

- Make sure Email/Password is enabled in Firebase Console
- Clear browser cache and reload
- Check browser console for additional errors

### User not found error?

- Make sure you created both Authentication user AND Firestore profile
- Check that the UID matches in both places
- Verify role field is exactly 'student', 'faculty', or 'admin'

### Access denied errors?

- Check the role field in Firestore users collection
- Students must have role='student'
- Faculty must have role='faculty' or role='admin'
- Role names are case-sensitive
