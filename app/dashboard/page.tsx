"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-service";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<string>("");
  const [userIdentifier, setUserIdentifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const user = getCurrentUser();

    if (!user) {
      // Not authenticated, redirect to login
      router.push("/login");
      return;
    }

    // Get user type and identifier from localStorage
    const storedUserType = localStorage.getItem("userType");
    const storedRollNumber = localStorage.getItem("rollNumber");
    const storedEmail = localStorage.getItem("email");

    // Redirect to role-specific dashboard
    if (storedUserType === "student") {
      router.push("/dashboard/student");
      return;
    } else if (storedUserType === "faculty") {
      router.push("/dashboard/faculty");
      return;
    }

    setUserType(storedUserType || "");
    setUserIdentifier(storedRollNumber || storedEmail || user.email || "");
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      userType={userType}
      userIdentifier={userIdentifier}
      title={`${userType === "student" ? "Student" : "Faculty"} Dashboard`}
    >
      {/* Additional Content */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Welcome to the KLH {userType === "student" ? "Student" : "Faculty"} Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is your personal dashboard. You can access various features and
            tools from the navigation cards above. Use the quick links to navigate to
            different sections of the portal.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
