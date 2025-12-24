"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { getCurrentUser } from "@/lib/auth-service";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [userIdentifier, setUserIdentifier] = useState<string>("");

  useEffect(() => {
    // Get faculty identifier from localStorage or user data
    const email = localStorage.getItem("email");
    const user = getCurrentUser();
    setUserIdentifier(email || user?.email || "");
  }, []);

  return (
    <AuthGuard allowedRoles={['faculty']} requireAuth={true} requireRole={true}>
      <DashboardLayout
        userType="faculty"
        userIdentifier={userIdentifier}
        title="Faculty Dashboard"
      >
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Use the navigation cards above to access Events, Issue Hub, and Room Sync features.
        </p>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
