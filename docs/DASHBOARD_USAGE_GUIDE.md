# Dashboard Component Usage Guide

## Quick Start

### Import Components

```tsx
import {
  Sidebar,
  DashboardKPIs,
  TodayOverview,
  ActivityFeed,
} from "@/components/dashboard";
```

### Basic Dashboard Layout

```tsx
export default function MyDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType="faculty" userIdentifier="user@example.com" />

      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <h1>Dashboard Title</h1>
        <DashboardKPIs />

        <div className="grid lg:grid-cols-2 gap-6">
          <TodayOverview />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
```

## Component APIs

### Sidebar

**Props:**

- `userType`: "student" | "faculty" | "admin"
- `userIdentifier`: string (email or roll number)

**Features:**

- Auto-hides on mobile
- Role-based menu filtering
- Active route detection
- Theme toggle included

### DashboardKPIs

**Props:** None (fetches data internally)

**Data Sources:**

- Events collection (today's events)
- Attendance collection (marked percentage)
- Allocations collection (rooms allocated)
- Posts collection (open issues)

### TodayOverview

**Props:** None (fetches data internally)

**Displays:**

- Next 3 upcoming events
- Active QR session detection
- Today's room allocations (first 3)

### ActivityFeed

**Props:** None (real-time listener)

**Activity Types:**

- Event creations
- Room allocations
- Question posts
- Answer posts

## Customization

### Adding a New Sidebar Item

```tsx
// In Sidebar.tsx, add to navItems array:
{
  href: "/my-feature",
  icon: MyIcon,
  label: "My Feature",
  roles: ["faculty", "admin"], // optional
}
```

### Adding a New KPI Metric

```tsx
// In DashboardKPIs.tsx, add to kpis array:
{
  label: "My Metric",
  value: myData.value,
  icon: MyIcon,
  color: "text-blue-600",
  bgColor: "bg-blue-50 dark:bg-blue-950/30",
}
```

### Adding a New Activity Type

```tsx
// In ActivityFeed.tsx, add a new listener:
const myQuery = query(
  collection(db, "myCollection"),
  orderBy("createdAt", "desc"),
  limit(5)
);

const unsubMy = onSnapshot(myQuery, (snapshot) => {
  const myActivities = snapshot.docs.map((doc) => ({
    id: `my-${doc.id}`,
    type: "my-type" as const,
    title: "My Activity",
    description: doc.data().description,
    timestamp: doc.data().createdAt?.toDate() || new Date(),
    icon: MyIcon,
    iconColor: "text-green-600",
  }));
  updateActivities(myActivities);
});

unsubscribers.push(unsubMy);
```

## Responsive Design

### Breakpoints

- Mobile: `< 1024px` - Sidebar hidden, single column
- Desktop: `≥ 1024px` - Sidebar visible, two columns

### Mobile-First Classes

```tsx
// Recommended pattern:
className = "p-4 md:p-8"; // padding
className = "text-base md:text-lg"; // font size
className = "gap-4 md:gap-6"; // grid gap
className = "lg:ml-64"; // sidebar offset
```

## Firestore Query Patterns

### Today's Data

```tsx
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayTimestamp = Timestamp.fromDate(today);

const q = query(
  collection(db, "myCollection"),
  where("date", ">=", todayTimestamp)
);
```

### Real-time Listener

```tsx
const unsubscribe = onSnapshot(
  query(collection(db, "myCollection"), orderBy("createdAt", "desc")),
  (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setData(data);
  }
);

return () => unsubscribe(); // cleanup
```

## Common Issues

### Sidebar Not Showing on Mobile

**Solution:** Make sure the main content has `lg:ml-64` class, not just `ml-64`

### KPIs Showing 0

**Solution:** Check Firestore collections exist and have data with correct field names

### Activity Feed Empty

**Solution:** Ensure collections have `createdAt` timestamps (Firestore Timestamp type)

### Dark Mode Colors Wrong

**Solution:** Always include both light and dark variants:

```tsx
className = "bg-white dark:bg-gray-900";
```

## Performance Tips

1. **Limit Firestore Queries:**

   - Use `limit(n)` on all queries
   - Only fetch today's data when possible

2. **Memoize Expensive Calculations:**

   ```tsx
   const filteredData = useMemo(
     () => data.filter((item) => item.active),
     [data]
   );
   ```

3. **Cleanup Listeners:**

   - Always return cleanup functions from useEffect
   - Unsubscribe from Firestore listeners on unmount

4. **Loading States:**
   - Show skeleton loaders while fetching
   - Prevent layout shift with consistent heights

## Accessibility

- All interactive elements are keyboard accessible
- ARIA labels on icon-only buttons
- Color is not the only indicator (use icons + text)
- Sufficient color contrast in light and dark modes

## Testing Checklist

- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] Works on mobile (hamburger menu)
- [ ] Works on desktop (sidebar visible)
- [ ] Dark mode looks correct
- [ ] Firestore data loads
- [ ] Real-time updates work
- [ ] Loading states display
- [ ] Empty states display
- [ ] Sign out works
- [ ] Theme toggle works
