"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { getCurrentUser } from "@/lib/auth-service";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

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
    <AuthGuard allowedRoles={["faculty"]} requireAuth={true} requireRole={true}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar userType="faculty" userIdentifier={userIdentifier} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 transition-all duration-300">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Faculty Dashboard
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Welcome back • Monitor campus activity and manage your resources
            </p>
          </div>

          {/* KPI Metrics */}
          <DashboardKPIs />

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column - Today's Overview */}
            <TodayOverview />

            {/* Right Column - Activity Feed */}
            <ActivityFeed />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
