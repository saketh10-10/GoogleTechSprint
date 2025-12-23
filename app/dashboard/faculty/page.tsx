"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { getCurrentUser } from "@/lib/auth-service";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MessageSquare, BarChart3, Settings, BookOpen } from "lucide-react";

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Issue Hub Management */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/issuehub")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Issue Hub</CardTitle>
              <CardDescription>Manage student issues</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Review and resolve student-reported issues
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Manage Issues
            </Button>
          </CardContent>
        </Card>

        {/* Room Sync Management */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/roomsync")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Room Allocation</CardTitle>
              <CardDescription>Manage classroom assignments</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Allocate and manage classroom resources
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Manage Rooms
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Attendance Analytics</CardTitle>
              <CardDescription>Class attendance reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View attendance statistics and reports
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Class Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">My Classes</CardTitle>
              <CardDescription>Teaching schedule</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage your teaching schedule and classes
            </p>
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Student Management */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Student Management</CardTitle>
              <CardDescription>Manage enrolled students</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage your students
            </p>
            <Button variant="outline" className="w-full">
              Manage Students
            </Button>
          </CardContent>
        </Card>

        {/* Course Materials */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <BookOpen className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Course Materials</CardTitle>
              <CardDescription>Upload and manage resources</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Share course materials with students
            </p>
            <Button variant="outline" className="w-full">
              Manage Materials
            </Button>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
