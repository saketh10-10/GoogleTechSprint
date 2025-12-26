# 🚀 GitHub to Firebase Hosting Setup Guide

## Problem: GitHub Not Connected to Firebase Hosting

Your GitHub repository `https://github.com/saketh10-10/GoogleTechSprint` is not currently connected to Firebase Hosting for automatic deployments.

## ✅ Solution: Connect GitHub to Firebase Hosting

### Step 1: Access Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/edusync-eaa2b/hosting

2. **Enable Hosting** (if not already enabled)
   - Click **"Get started"** or **"Add site"**

### Step 2: Connect to GitHub

1. **Click "Connect to GitHub"**
   - Look for the GitHub integration button
   - It might say "Connect repository" or "Link to GitHub"

2. **Authorize Firebase with GitHub**
   - Click **"Authorize with GitHub"**
   - Sign in to GitHub (if prompted)
   - Grant Firebase access to your repositories

### Step 3: Select Repository

1. **Choose Repository**
   - Select: `saketh10-10/GoogleTechSprint`
   - Select branch: `master`

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: out
   Node.js version: 18 (or latest)
   ```

### Step 4: Deploy

1. **Click "Connect"**
2. **Firebase will automatically:**
   - Clone your repository
   - Run `npm run build`
   - Deploy the `out` directory to Firebase Hosting

## 📊 Expected Results

After successful connection:

- ✅ **Automatic Deployments**: Every push to `master` triggers deployment
- ✅ **Live URL**: `https://edusync-eaa2b.web.app`
- ✅ **Build Logs**: Viewable in Firebase Console → Hosting
- ✅ **GitHub Actions**: Deployment status visible in GitHub

## 🔍 Troubleshooting

### If "Connect to GitHub" button is missing:

1. **Check Firebase Plan**
   - GitHub integration requires Blaze (pay-as-you-go) plan
   - Free plan doesn't support GitHub integration

2. **Upgrade Firebase Plan**
   - Go to Firebase Console → Settings → Usage and billing
   - Upgrade to Blaze plan (required for GitHub integration)

### Alternative: Manual Deployments

If you can't use GitHub integration:

```bash
# Build locally
npm run build

# Deploy manually
npx firebase-tools deploy --only hosting
```

### Build Errors in Firebase:

1. **Check Build Logs** in Firebase Console
2. **Verify Dependencies** - ensure all packages are in `package.json`
3. **Check Node Version** - Firebase uses Node 18 by default
4. **Environment Variables** - may need to set in Firebase Console

## 🎯 Current Project Status

- ✅ **Repository**: https://github.com/saketh10-10/GoogleTechSprint
- ✅ **Firebase Project**: edusync-eaa2b
- ✅ **Build Ready**: `npm run build` works locally
- ✅ **Hosting Config**: `firebase.json` configured
- ❌ **GitHub Integration**: Not connected yet

## 🚀 Quick Setup Commands

```bash
# If you have Firebase CLI working:
npx firebase-tools hosting:channel:deploy preview

# Or manual deploy:
npm run build
npx firebase-tools deploy --only hosting
```

## 📞 Need Help?

1. **Check Firebase Console** → Hosting for current status
2. **Verify Repository Access** - ensure you have admin access
3. **Check Build Status** - run `npm run build` locally first
4. **Firebase Plan** - confirm you have Blaze plan for GitHub integration

## 🎉 Success Indicators

- **Firebase Console** shows "Connected to GitHub"
- **GitHub Repository** shows Firebase deployment status
- **Live Site** updates automatically on pushes
- **No More Manual Deploys** needed

---

**Follow these steps and your GitHub repository will be automatically deployed to Firebase Hosting!** 🚀


