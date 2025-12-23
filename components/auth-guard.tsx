"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'faculty' | 'admin')[];
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  allowedRoles = ['student', 'faculty', 'admin'],
  requireAuth = true
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(firebaseUser);
            setUserRole(userData.role);

            // Check if user role is allowed
            if (!allowedRoles.includes(userData.role)) {
              router.push('/unauthorized');
              return;
            }
          } else {
            // User document doesn't exist, redirect to profile setup
            router.push('/profile/setup');
            return;
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          router.push('/login');
          return;
        }
      } else {
        // No user signed in
        if (requireAuth) {
          router.push('/login');
          return;
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, allowedRoles, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is authenticated and has correct role, show children
  if (user && userRole && allowedRoles.includes(userRole as any)) {
    return <>{children}</>;
  }

  // This should not be reached due to redirects above, but just in case
  return null;
}
