# Firebase Configuration Template

## 📝 Configuration Checklist

Use this file to track your Firebase setup progress and store configuration details.

---

## 1. Firebase Project Details

### Project Information

- **Project Name**: ************\_\_\_************
- **Project ID**: **************\_**************
- **Region**: ****************\_****************
- **Created Date**: ************\_\_\_************

### Firebase Console URL

```
https://console.firebase.google.com/project/YOUR_PROJECT_ID
```

---

## 2. Firebase Web App Configuration

### Get Your Config

1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Click Web icon (</>) to add web app
4. Copy the firebaseConfig object

### Your Firebase Config

```javascript
const firebaseConfig = {
  apiKey: "___________________________________",
  authDomain: "______________________________",
  projectId: "_________________________________",
  storageBucket: "____________________________",
  messagingSenderId: "_______________________",
  appId: "____________________________________",
};
```

### Files to Update

Replace firebaseConfig in these files:

- [ ] `public/roomsync/login.html` (line ~85)
- [ ] `public/roomsync/dashboard.html` (line ~127)
- [ ] `public/roomsync/rooms.html` (line ~291)
- [ ] `public/roomsync/sections.html` (line ~259)
- [ ] `public/roomsync/allocations.html` (line ~357)

---

## 3. Gemini AI API Key

### Get Your API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Select your Firebase project
4. Copy the API key

### Your Gemini API Key

```
___________________________________________________
```

### Set in Cloud Functions

```bash
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"
```

### Verify Configuration

```bash
firebase functions:config:get
```

Expected output:

```json
{
  "gemini": {
    "api_key": "AIza..."
  }
}
```

---

## 4. Authentication Setup

### Email/Password Provider

- [ ] Navigate to Authentication → Sign-in method
- [ ] Click "Email/Password"
- [ ] Enable "Email/Password" (first toggle)
- [ ] Save changes

### Admin User Creation

**Step 1: Create User in Authentication**

- [ ] Go to Authentication → Users
- [ ] Click "Add User"
- **Email**: ****************\_\_\_****************
- **Password**: ****************\_****************
- **User UID** (copy this): **********\_**********

**Step 2: Create User Document in Firestore**

- [ ] Go to Firestore Database
- [ ] Click "Start Collection"
- **Collection ID**: `users`
- **Document ID**: (paste User UID from above)
- **Fields**:
  - `email` (string): (same as above)
  - `role` (string): `admin`
  - `createdAt` (timestamp): (click clock icon)

---

## 5. Firestore Setup

### Database Creation

- [ ] Go to Firestore Database
- [ ] Click "Create Database"
- **Mode**: Production mode
- **Region**: (select closest to you)

### Collections to Create

Collections will be created automatically when first document is added:

- `users` - User profiles with roles
- `rooms` - Room registrations
- `sections` - Class sections
- `allocations` - Room allocations
- `ai_suggestions` - Temporary AI cache

### Security Rules Deployment

```bash
firebase deploy --only firestore:rules
```

### Verify Rules Deployed

- [ ] Go to Firestore Database → Rules tab
- [ ] Verify rules match your firestore.rules file

---

## 6. Cloud Functions Setup

### Node.js Version Check

```bash
node --version
```

**Required**: v18 or higher

### Install Dependencies

```bash
cd functions
npm install
cd ..
```

### Deploy Functions

```bash
firebase deploy --only functions
```

### Deployed Functions Checklist

After deployment, verify these functions exist:

- [ ] `createRoomAllocation`
- [ ] `getAiRoomSuggestions`
- [ ] `validateAllocation`

### View Functions URLs

```bash
firebase functions:list
```

---

## 7. Firebase Hosting Setup

### Initialize Hosting

```bash
firebase init hosting
```

**Settings:**

- Public directory: `public`
- Single-page app: `No`
- GitHub deployment: (optional)

### Deploy Hosting

```bash
firebase deploy --only hosting
```

### Your Hosting URL

```
https://__________________________________________.web.app
```

### Test URL

```
https://__________________________________________.web.app/roomsync/login.html
```

---

## 8. Test Users

### Admin User

- **Email**: ****************\_\_\_****************
- **Password**: ****************\_****************
- **Role**: admin
- **Permissions**: Full access

### Faculty User 1

- **Email**: ****************\_\_\_****************
- **Password**: ****************\_****************
- **Role**: faculty
- **Permissions**: View/Edit sections, Create allocations

### Faculty User 2

- **Email**: ****************\_\_\_****************
- **Password**: ****************\_****************
- **Role**: faculty
- **Permissions**: View/Edit sections, Create allocations

### Student User (Blocked)

- **Email**: ****************\_\_\_****************
- **Password**: ****************\_****************
- **Role**: student
- **Expected**: Access Denied

---

## 9. Sample Data

### Sample Rooms

**Room 1:**

- Name: Main Lecture Hall
- Number: R-301
- Capacity: 60
- Type: classroom
- Status: available

**Room 2:**

- Name: Computer Lab
- Number: LAB-101
- Capacity: 40
- Type: lab
- Status: available

**Room 3:**

- Name: Seminar Hall
- Number: SH-201
- Capacity: 100
- Type: seminar hall
- Status: available

### Sample Sections

**Section 1:**

- Name: CSE-A1
- Department: Computer Science
- Strength: 55
- Duration: 1 hour
- Time Slot: 9:00 AM - 10:00 AM
- Preferred Type: classroom

**Section 2:**

- Name: ECE-B1
- Department: Electronics
- Strength: 45
- Duration: 2 hours
- Time Slot: 10:00 AM - 11:00 AM
- Preferred Type: lab

---

## 10. Deployment Commands Reference

### Full Deployment

```bash
firebase deploy
```

### Individual Deployments

```bash
# Security rules only
firebase deploy --only firestore:rules

# Cloud Functions only
firebase deploy --only functions

# Hosting only
firebase deploy --only hosting

# Specific function
firebase deploy --only functions:createRoomAllocation
```

### View Logs

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only createRoomAllocation

# Last 10 entries
firebase functions:log -n 10
```

### Configuration Management

```bash
# View all config
firebase functions:config:get

# Set config
firebase functions:config:set key="value"

# Remove config
firebase functions:config:unset key
```

---

## 11. Testing Checklist

### Authentication Tests

- [ ] Admin can login
- [ ] Faculty can login
- [ ] Student login is blocked
- [ ] Invalid credentials rejected
- [ ] Logout works correctly

### Room Management Tests

- [ ] Admin can create rooms
- [ ] Faculty cannot create rooms (button hidden)
- [ ] Room listing loads correctly
- [ ] Filters work (type, capacity, status)
- [ ] Edit room works (admin only)
- [ ] Delete room works (admin only)

### Section Management Tests

- [ ] Faculty can create sections
- [ ] Admin can create sections
- [ ] Section listing loads correctly
- [ ] Filters work (department, time slot)
- [ ] Edit section works
- [ ] Delete section works

### Allocation Tests

- [ ] Allocation wizard opens
- [ ] Section selection populates
- [ ] AI suggestions load (3-8 seconds)
- [ ] 3 suggestions displayed
- [ ] AI reasoning is shown
- [ ] Top suggestion marked as recommended
- [ ] Allocation creation succeeds
- [ ] Allocation appears in table

### Security Tests

- [ ] Student role is blocked at login
- [ ] Firestore rules prevent unauthorized reads
- [ ] Cloud Functions validate roles
- [ ] Backend-only operations cannot be called from client

### Conflict Tests

- [ ] Same room/time conflict detected
- [ ] Overlapping time slots rejected
- [ ] Insufficient capacity rejected
- [ ] Unavailable room rejected

---

## 12. Monitoring Setup

### Firebase Console Monitoring

- [ ] Enable Performance Monitoring
- [ ] Set up Budget Alerts
- [ ] Configure Error Reporting
- [ ] Enable Analytics (optional)

### Alerts to Set Up

1. **Firestore Reads Alert**: Warn if > 50K reads/day
2. **Function Errors Alert**: Email on function errors
3. **Auth Errors Alert**: Notify on multiple failed logins

---

## 13. Production Checklist

### Security

- [ ] Firebase App Check enabled
- [ ] API key restrictions set
- [ ] Admin accounts have 2FA
- [ ] Security rules reviewed
- [ ] Audit logging enabled

### Performance

- [ ] Firestore indexes created
- [ ] Function cold start optimized
- [ ] CDN caching configured
- [ ] Image optimization completed

### Monitoring

- [ ] Error tracking set up
- [ ] Performance monitoring active
- [ ] Budget alerts configured
- [ ] Backup strategy in place

### Documentation

- [ ] Admin guide created
- [ ] User training completed
- [ ] Support process defined
- [ ] Disaster recovery plan documented

---

## 14. Post-Deployment

### Verification Steps

1. [ ] Visit hosting URL
2. [ ] Login as admin
3. [ ] Create a room
4. [ ] Create a section
5. [ ] Test AI allocation
6. [ ] Verify allocation in database
7. [ ] Test as faculty user
8. [ ] Verify student is blocked

### Performance Baseline

- **Page Load Time**: **\_\_\_\_** seconds
- **AI Suggestion Time**: **\_\_\_\_** seconds
- **Firestore Query Time**: **\_\_\_\_** ms
- **Function Execution Time**: **\_\_\_\_** ms

---

## 15. Support Information

### Firebase Support

- **Documentation**: https://firebase.google.com/docs
- **Support**: https://firebase.google.com/support
- **Community**: https://firebase.google.com/community

### Gemini AI Support

- **Documentation**: https://ai.google.dev/docs
- **API Reference**: https://ai.google.dev/api
- **Pricing**: https://ai.google.dev/pricing

### Project Contacts

- **Admin**: ******************\_******************
- **Developer**: ****************\_\_****************
- **Support Email**: **************\_\_**************

---

## 16. Backup & Recovery

### Firestore Backup

```bash
# Export Firestore data
gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
```

### Configuration Backup

- [ ] Firebase config saved
- [ ] Gemini API key stored securely
- [ ] User credentials documented
- [ ] firestore.rules backed up
- [ ] functions/index.js version controlled

---

## 17. Cost Estimation

### Firebase Free Tier (Spark Plan)

- Authentication: 10,000 verifications/month
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Functions: 2M invocations/month
- Hosting: 10GB storage, 360MB/day transfer

### Gemini AI Free Tier

- 60 requests per minute
- 1,500 requests per day
- Free for testing and low-volume use

### Expected Monthly Cost (Estimate)

- Firebase: $****\_\_**** (likely $0 on free tier)
- Gemini AI: $****\_\_**** (likely $0 on free tier)
- **Total**: $****\_\_**** per month

---

## 18. Maintenance Schedule

### Daily

- [ ] Check error logs
- [ ] Monitor function execution
- [ ] Review failed authentications

### Weekly

- [ ] Review allocation patterns
- [ ] Check AI suggestion quality
- [ ] Verify database integrity

### Monthly

- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] User feedback collection

---

## 19. Troubleshooting Notes

### Common Issues Encountered

**Issue 1:** ********************\_\_\_\_********************
**Solution:** ********************\_\_\_********************

**Issue 2:** ********************\_\_\_\_********************
**Solution:** ********************\_\_\_********************

**Issue 3:** ********************\_\_\_\_********************
**Solution:** ********************\_\_\_********************

---

## 20. Version History

### Version 1.0.0 (Initial Release)

- **Date**: ******\_\_\_******
- **Features**: RBAC, AI allocation, Conflict prevention
- **Deployed By**: **********\_**********

### Version 1.0.1 (Updates)

- **Date**: ******\_\_\_******
- **Changes**: ****************\_****************
- **Deployed By**: **********\_**********

---

**Configuration Status**: ☐ Complete ☐ In Progress ☐ Not Started

**System Ready for Production**: ☐ Yes ☐ No

**Reviewed By**: ************\_************ Date: ******\_******

**Approved By**: ************\_************ Date: ******\_******
