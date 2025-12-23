# RoomSync - AI-Powered Room Allocation System

## 🎯 System Overview

RoomSync is a comprehensive, production-ready room allocation system built exclusively with Google Firebase technologies. The system provides intelligent room allocation with AI-powered optimization using Google's Gemini API, strict Role-Based Access Control (RBAC), and comprehensive conflict prevention mechanisms.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No frameworks)
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Database**: Cloud Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **AI**: Google Gemini Pro API
- **Security**: Multi-layer (Firestore Rules + Cloud Functions + RBAC)

### System Components

1. **Dashboard** - Statistics and quick actions overview
2. **Room Management** - CRUD operations for room registration
3. **Section Management** - Class section registration and management
4. **Allocation System** - AI-powered room allocation with suggestions

## 🔒 Security Architecture

### Role-Based Access Control (RBAC)

**Allowed Roles:**

- `faculty` - Can view, create, update sections and allocations
- `admin` - Full access including room creation and deletion

**Blocked Roles:**

- `student` - Completely blocked from system access
- Any unauthorized role

**Implementation:**

```javascript
// users collection structure
{
  uid: "user123",
  email: "faculty@klh.edu",
  role: "faculty", // or "admin"
  createdAt: timestamp
}
```

### Security Rules (firestore.rules)

**Key Rules:**

1. **Users Collection**: Self-read only, admin-write
2. **Rooms Collection**:
   - Read: Faculty/Admin
   - Create/Delete: Admin only
   - Update availability: Faculty/Admin
3. **Sections Collection**: Full CRUD for Faculty/Admin
4. **Allocations Collection**:
   - Read/Delete: Faculty/Admin
   - Create: Backend only (forces validation)
5. **AI Suggestions Collection**: Read-only for Faculty/Admin, backend-only creation

## 📊 Data Models

### 1. Rooms Collection

```javascript
{
  roomName: "Main Lecture Hall",
  roomNumber: "R-301",
  capacity: 60,
  roomType: "classroom", // or "lab", "seminar hall"
  availabilityStatus: "available", // or "unavailable"
  description: "Optional details",
  createdAt: timestamp,
  createdBy: "userId",
  updatedAt: timestamp,
  updatedBy: "userId"
}
```

### 2. Sections Collection

```javascript
{
  sectionName: "CSE-A1",
  department: "Computer Science",
  classStrength: 55,
  requiredDuration: 1.5, // hours
  timeSlot: "9:00 AM - 10:00 AM",
  preferredRoomType: "classroom", // optional
  additionalRequirements: "Projector needed", // optional
  createdAt: timestamp,
  createdBy: "userId",
  updatedAt: timestamp,
  updatedBy: "userId"
}
```

### 3. Allocations Collection

```javascript
{
  roomId: "roomDocId",
  sectionId: "sectionDocId",
  allocationDate: "2024-01-15",
  timeSlot: "9:00 AM - 10:00 AM",
  duration: 1.5,
  createdAt: timestamp,
  createdBy: "userId"
}
```

### 4. AI Suggestions Collection (Temporary)

```javascript
{
  sectionId: "sectionDocId",
  allocationDate: "2024-01-15",
  suggestions: [...],
  createdAt: timestamp,
  expiresAt: timestamp // Auto-cleanup after 1 hour
}
```

## 🤖 AI Integration

### Gemini API Integration

**Function**: `getAiRoomSuggestions()`

**Prompt Engineering:**

```
Analyze the following section requirements and available rooms to suggest optimal room allocations:

SECTION DETAILS:
- Name: CSE-A1
- Strength: 55 students
- Duration: 1.5 hours
- Time Slot: 9:00 AM - 10:00 AM
- Preferred Room Type: classroom

AVAILABLE ROOMS (after conflict checking):
[Room details with capacity, type, current utilization]

OPTIMIZATION CRITERIA:
1. Capacity match (avoid significant over/under capacity)
2. Room type preference
3. Minimize unused room capacity
4. Distribute load across rooms

Respond ONLY with a JSON array of top 3 suggestions...
```

**Response Format:**

```json
[
  {
    "roomId": "room123",
    "roomName": "Main Lecture Hall",
    "roomNumber": "R-301",
    "capacity": 60,
    "roomType": "classroom",
    "utilizationPercentage": 92,
    "reasoning": "Excellent capacity match with 92% utilization..."
  }
]
```

**Fallback Algorithm:**
If Gemini API fails, system uses `simpleRoomSuggestion()`:

1. Filter rooms by capacity (>= classStrength)
2. Prefer matching room types
3. Sort by utilization score (capacity / classStrength)
4. Return top 3 matches

## ☁️ Cloud Functions

### 1. `createRoomAllocation`

**Callable Function** - Creates a new room allocation with comprehensive validation.

**Parameters:**

```javascript
{
  roomId: string,
  sectionId: string,
  allocationDate: string, // YYYY-MM-DD
  timeSlot: string,
  duration: number
}
```

**Validation Steps:**

1. ✓ User authentication
2. ✓ Role check (faculty/admin)
3. ✓ Room exists and available
4. ✓ Room capacity >= class strength
5. ✓ Section exists
6. ✓ No time slot conflicts
7. ✓ Transaction-based creation
8. ✓ Audit trail logging

**Error Responses:**

- `unauthenticated`: User not logged in
- `permission-denied`: Insufficient role permissions
- `not-found`: Room or section doesn't exist
- `failed-precondition`: Room unavailable or capacity insufficient
- `already-exists`: Time slot conflict detected

### 2. `getAiRoomSuggestions`

**Callable Function** - Returns AI-optimized room suggestions.

**Parameters:**

```javascript
{
  sectionId: string,
  allocationDate: string,
  timeSlot: string,
  duration: number
}
```

**Process Flow:**

1. Check role permissions
2. Fetch section details
3. Get all available rooms
4. Check for time conflicts
5. Call Gemini API with structured prompt
6. Parse and validate JSON response
7. Cache suggestions in Firestore (1-hour TTL)
8. Fallback to algorithmic suggestions if AI fails

**Response:**

```javascript
{
  suggestions: [
    {
      roomId, roomName, roomNumber, capacity,
      roomType, utilizationPercentage, reasoning
    }
  ],
  source: "gemini-api" // or "fallback-algorithm"
}
```

### 3. `validateAllocation`

**Callable Function** - Pre-validates allocation without creating.

**Use Case**: Frontend validation before confirmation step.

**Returns:**

```javascript
{
  valid: true/false,
  errors: ["Array of validation errors"]
}
```

### Helper Functions

**`checkUserRole(userId, allowedRoles)`**

- Validates user has required role from Firestore
- Returns true if authorized, false otherwise

**`checkTimeSlotConflict(roomId, date, timeSlot, duration)`**

- Parses time slots (e.g., "9:00 AM - 10:00 AM")
- Checks for overlapping allocations
- Returns true if conflict exists

**`simpleRoomSuggestion(section, availableRooms)`**

- Fallback algorithm for room suggestions
- Filters by capacity and room type preference
- Calculates utilization scores
- Returns top 3 suggestions

## 🌐 Frontend Pages

### 1. dashboard.html

**Features:**

- Statistics cards (total rooms, available rooms, sections, allocations)
- Quick action links
- Recent allocations table
- System features showcase
- Role-based content display

### 2. rooms.html

**Features:**

- Room listing with real-time availability
- Advanced filters (type, capacity, status)
- Add/Edit/Delete operations (admin only)
- Modal-based CRUD forms
- Grid layout with hover effects

**RBAC Implementation:**

- Admin: Can add/edit/delete rooms
- Faculty: View-only access

### 3. sections.html

**Features:**

- Section listing with department badges
- Time slot and department filters
- Add/Edit/Delete operations
- Form validation
- Section details preview

**Required Fields:**

- Section name, department, class strength
- Required duration, time slot
- Optional: Preferred room type, additional requirements

### 4. allocations.html

**Features:**

- 3-step allocation wizard
- AI-powered suggestions display
- Confirmation step with summary
- Active allocations table
- Delete allocation capability

**Allocation Flow:**

1. **Step 1**: Select section and enter allocation details
2. **Step 2**: Review AI suggestions with reasoning
3. **Step 3**: Confirm allocation and submit

## 🎨 UI/UX Design

### Design System

- **Color Palette**: Primary Blue (#2563eb), Success Green, Danger Red
- **Typography**: Inter font family, responsive sizing
- **Spacing**: 4px grid system
- **Radius**: Small (6px), Medium (10px), Large (16px)
- **Shadows**: Layered elevation system

### Responsive Breakpoints

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

### Component Library

- Stat cards with animated numbers
- Modal dialogs (small, large, x-large)
- Data tables with hover states
- Filter cards with multi-select
- Loading spinners
- Empty state illustrations
- Error state displays

## 🔥 Firebase Configuration

### 1. Initialize Firebase Project

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:

- ☑ Firestore
- ☑ Functions
- ☑ Hosting

### 2. Update Firebase Config

Replace in all HTML files:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Set Gemini API Key

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

Get API key from: https://makersuite.google.com/app/apikey

### 5. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6. Deploy Frontend

```bash
firebase deploy --only hosting
```

## 👥 User Setup

### Create Admin User

```javascript
// In Firebase Console > Authentication
1. Add user: admin@klh.edu
2. Note the User UID

// In Firestore Console > users collection
{
  uid: "copied-uid",
  email: "admin@klh.edu",
  role: "admin",
  createdAt: Timestamp.now()
}
```

### Create Faculty User

```javascript
// In Firebase Console > Authentication
1. Add user: faculty@klh.edu

// In Firestore > users collection
{
  uid: "faculty-uid",
  email: "faculty@klh.edu",
  role: "faculty",
  createdAt: Timestamp.now()
}
```

### Student Access (Blocked)

Students are completely blocked at security rule level:

```javascript
// Any user without 'faculty' or 'admin' role
allow read, write: if request.auth != null &&
  (getUserRole(request.auth.uid) == 'faculty' ||
   getUserRole(request.auth.uid) == 'admin');
```

## 🧪 Testing Guide

### 1. Role-Based Access Testing

**Test Admin Access:**

1. Login as admin@klh.edu
2. Verify "Add New Room" button visible
3. Create a new room
4. Edit existing room
5. Delete a room
6. Verify success

**Test Faculty Access:**

1. Login as faculty@klh.edu
2. Verify "Add New Room" button NOT visible
3. Attempt to create room (should fail)
4. View rooms successfully
5. Create section successfully
6. Create allocation successfully

**Test Student Access (Blocked):**

1. Create user with role: "student"
2. Attempt login
3. Verify redirect or "Access Denied" message
4. Verify Firestore rules block all operations

### 2. Room Management Testing

**Create Room:**

```javascript
{
  roomName: "Testing Lab",
  roomNumber: "TL-101",
  capacity: 40,
  roomType: "lab",
  availabilityStatus: "available",
  description: "Computer Lab with 40 systems"
}
```

✓ Verify room appears in list
✓ Check filters work correctly

**Update Room:**

- Change availability status
- Verify real-time updates

**Delete Room:**

- Confirm deletion prompt
- Verify room removed from list

### 3. Section Management Testing

**Create Section:**

```javascript
{
  sectionName: "CSE-B2",
  department: "Computer Science",
  classStrength: 45,
  requiredDuration: 2,
  timeSlot: "10:00 AM - 11:00 AM",
  preferredRoomType: "classroom"
}
```

✓ Verify section card displays correctly
✓ Test filters (department, time slot)

### 4. AI Allocation Testing

**Test AI Suggestions:**

1. Navigate to allocations.html
2. Click "Create New Allocation"
3. Select section: CSE-B2
4. Enter date: Tomorrow's date
5. Time slot: 10:00 AM - 11:00 AM
6. Duration: 2 hours
7. Click "Get AI Suggestions"

**Verify AI Response:**
✓ Loading spinner displays
✓ 3 suggestions returned
✓ Top suggestion has "Recommended" badge
✓ Each suggestion shows:

- Room name and number
- Capacity and type
- Utilization percentage
- AI reasoning text

**Test Allocation Creation:**

1. Select a suggested room
2. Review confirmation details
3. Confirm allocation
4. Verify allocation appears in table

### 5. Conflict Prevention Testing

**Create Conflicting Allocation:**

1. Create allocation: Room R-301, 9:00 AM - 10:00 AM
2. Attempt second allocation: Same room, 9:30 AM - 10:30 AM
3. Verify error: "Time slot conflict detected"

**Test Duration Conflicts:**

- 1-hour allocation: 9:00 AM - 10:00 AM
- Conflicting 2-hour allocation: 8:30 AM - 10:30 AM
- Verify prevention

### 6. Capacity Validation Testing

**Test Insufficient Capacity:**

1. Create section with 60 students
2. Attempt allocation to room with 40 capacity
3. Verify error: "Room capacity insufficient"

## 📈 Performance Optimization

### Firestore Indexes

Create composite indexes for:

```javascript
// rooms collection
-roomType(Ascending) +
  availabilityStatus(Ascending) -
  // sections collection
  department(Ascending) +
  timeSlot(Ascending) -
  // allocations collection
  roomId(Ascending) +
  allocationDate(Ascending);
```

### Caching Strategy

- AI suggestions cached for 1 hour
- Room availability real-time updates
- Section data cached on load

### Best Practices

1. Minimize Firestore reads with efficient queries
2. Use pagination for large datasets
3. Implement debouncing on filters
4. Cache static data in localStorage
5. Lazy load modal content

## 🐛 Error Handling

### Frontend Error Handling

```javascript
try {
  // Firebase operation
} catch (error) {
  if (error.code === "permission-denied") {
    alert("Access denied. Admin privileges required.");
  } else if (error.code === "not-found") {
    alert("Resource not found.");
  } else {
    alert("Error: " + error.message);
  }
}
```

### Backend Error Handling

All Cloud Functions include comprehensive error handling:

- Input validation
- Role verification
- Resource existence checks
- Conflict detection
- Transaction rollback on failure

## 🔍 Monitoring & Logging

### Firebase Console Monitoring

1. **Authentication**: Track login attempts
2. **Firestore**: Monitor read/write operations
3. **Functions**: View execution logs and errors
4. **Performance**: Track page load times

### Cloud Function Logs

```bash
firebase functions:log
```

Filter by function:

```bash
firebase functions:log --only createRoomAllocation
```

### Audit Trail

All allocations include:

- createdBy: User UID
- createdAt: Timestamp
- Immutable after creation

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Update Firebase config in all HTML files
- [ ] Set Gemini API key in Functions config
- [ ] Test all CRUD operations locally
- [ ] Verify security rules work correctly
- [ ] Test RBAC for all roles
- [ ] Validate AI suggestions functionality

### Deployment Steps

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Deploy Cloud Functions
firebase deploy --only functions

# 3. Deploy Hosting
firebase deploy --only hosting

# 4. Verify deployment
firebase open hosting:site
```

### Post-Deployment

- [ ] Create admin user account
- [ ] Create test faculty account
- [ ] Add sample rooms
- [ ] Add sample sections
- [ ] Test end-to-end allocation flow
- [ ] Verify AI suggestions work in production
- [ ] Monitor error logs for 24 hours

## 📞 Troubleshooting

### Common Issues

**Issue**: "Permission Denied" on room creation

- **Cause**: User role not set correctly
- **Fix**: Verify users/{uid}/role === 'admin' in Firestore

**Issue**: AI suggestions timeout

- **Cause**: Gemini API key not set or invalid
- **Fix**: Run `firebase functions:config:get` and verify gemini.api_key

**Issue**: Time slot conflicts not detected

- **Cause**: Date format mismatch
- **Fix**: Ensure allocationDate format is "YYYY-MM-DD"

**Issue**: Modal doesn't close

- **Cause**: JavaScript event listener conflict
- **Fix**: Check browser console for errors

**Issue**: Rooms not loading

- **Cause**: Firestore security rules blocking read
- **Fix**: Verify user role in Firestore

## 🔐 Security Recommendations

### Production Checklist

1. **Enable Firebase App Check** to prevent API abuse
2. **Set up Firebase Auth domain restrictions**
3. **Enable Firestore Rules audit logging**
4. **Implement rate limiting on Cloud Functions**
5. **Set up API key restrictions in Google Cloud Console**
6. **Enable 2FA for admin accounts**
7. **Regular security rule audits**
8. **Monitor suspicious activity patterns**

### Data Privacy

- No PII stored except user emails
- Audit logs for compliance
- Role-based data access
- Encrypted data at rest (Firebase default)

## 📚 API Reference

### Cloud Functions

#### createRoomAllocation

```typescript
Request: {
  roomId: string,
  sectionId: string,
  allocationDate: string,
  timeSlot: string,
  duration: number
}

Response: {
  allocationId: string,
  message: string
}
```

#### getAiRoomSuggestions

```typescript
Request: {
  sectionId: string,
  allocationDate: string,
  timeSlot: string,
  duration: number
}

Response: {
  suggestions: RoomSuggestion[],
  source: 'gemini-api' | 'fallback-algorithm'
}
```

#### validateAllocation

```typescript
Request: {
  roomId: string,
  sectionId: string,
  allocationDate: string,
  timeSlot: string,
  duration: number
}

Response: {
  valid: boolean,
  errors: string[]
}
```

## 🎓 Best Practices

### Code Quality

- Use ESLint for JavaScript linting
- Follow Firebase best practices
- Implement error boundaries
- Use semantic HTML
- Write descriptive comments

### Performance

- Minimize bundle size (no frameworks = smaller footprint)
- Optimize images and assets
- Use CDN for Firebase SDKs
- Implement lazy loading
- Cache aggressively

### Maintainability

- Modular function design
- Consistent naming conventions
- Comprehensive documentation
- Version control best practices
- Regular dependency updates

## 📄 License & Credits

**Built with:**

- Firebase (Google Cloud Platform)
- Gemini AI (Google)
- Modern Web Standards (HTML5, CSS3, ES6+)

**System Type**: Production-Ready Educational Software

---

## 🆘 Support

For issues or questions:

1. Check Firebase Console logs
2. Review Firestore security rules
3. Verify Cloud Function execution logs
4. Test with different user roles
5. Contact system administrator

**System Status**: ✅ Production Ready
**Last Updated**: 2024
**Version**: 1.0.0
