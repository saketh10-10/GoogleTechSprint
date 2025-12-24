"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth-service";
import { Loader2 } from "lucide-react";

// Development mode check - use mock auth if Firebase is not properly configured
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'AIzaSyDemoKeyForDevelopmentPurposesOnly' &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'YOUR_API_KEY_HERE';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'faculty' | 'admin')[];
  requireAuth?: boolean;
  requireRole?: boolean; // Whether to wait for role data before allowing access
}

export default function AuthGuard({
  children,
  allowedRoles = ['student', 'faculty', 'admin'],
  requireAuth = true,
  requireRole = true // Default to requiring role for dashboard pages
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // First, check authentication status
    const checkAuth = async () => {
      if (isFirebaseConfigured) {
        // Use real Firebase authentication
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            setAuthChecked(true);
            // Now fetch role data
            await fetchUserRole(firebaseUser.uid);
          } else {
            // No user signed in
            setUser(null);
            setUserRole(null);
            setAuthChecked(true);
            setRoleChecked(true);
            if (requireAuth) {
              router.push('/login');
            }
          }
        });
        return unsubscribe;
      } else {
        // Use mock authentication (development mode)
        const mockUser = getCurrentUser();
        if (mockUser) {
          setUser(mockUser as any);
          setAuthChecked(true);
          // For mock auth, get role from localStorage
          const storedRole = localStorage.getItem('userType') || localStorage.getItem('userRole');
          setUserRole(storedRole);
          setRoleChecked(true);
        } else {
          setAuthChecked(true);
          setRoleChecked(true);
          if (requireAuth) {
            router.push('/login');
            return;
          }
        }
      }
    };

    const fetchUserRole = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          setUserRole(role);

          // Check if current path matches user role
          if (pathname?.startsWith('/dashboard')) {
            if (role === 'student' && !pathname.includes('/student')) {
              router.push('/dashboard/student');
              return;
            } else if (role === 'faculty' && !pathname.includes('/faculty')) {
              router.push('/dashboard/faculty');
              return;
            }
          }

          // Check if user role is allowed for this route
          if (allowedRoles && !allowedRoles.includes(role)) {
            router.push('/unauthorized');
            return;
          }
        } else {
          // User document doesn't exist - this shouldn't happen after signup
          if (process.env.NODE_ENV === 'development') {
            console.error('User document not found in database');
          }
          // Allow access but mark as no role
          setUserRole(null);
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching user role:', error);
        }

        // Handle failure by checking local cache before giving up
        const cachedRole = localStorage.getItem('userType') || localStorage.getItem('userRole');
        if (cachedRole) {
          console.log('🔄 Fallback to cached role in AuthGuard');
          setUserRole(cachedRole);
        } else {
          setUserRole(null);
        }
      } finally {
        setRoleChecked(true);
      }
    };

    let unsubscribe: (() => void) | undefined;

    checkAuth().then(cleanup => {
      if (typeof cleanup === 'function') {
        unsubscribe = cleanup;
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, pathname, requireAuth, requireRole]);

  // Show loading only if we're still checking auth or if we require role data and it's not loaded
  const shouldShowLoading = !authChecked || (requireRole && !roleChecked);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {authChecked ? 'Loading user data...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // If we don't require auth, allow access
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If we require auth but user is not authenticated, they would have been redirected
  // If we require role but role is missing, show error state
  if (requireRole && userRole === null && authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Account Setup Incomplete</h2>
          <p className="text-muted-foreground mb-4">
            Your account information is being set up. Please try logging in again.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
