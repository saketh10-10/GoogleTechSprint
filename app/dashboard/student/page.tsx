"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { getCurrentUser } from "@/lib/auth-service";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, MessageSquare, Camera, QrCode } from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [userIdentifier, setUserIdentifier] = useState<string>("");

  useEffect(() => {
    // Get student identifier from localStorage or user data
    const rollNumber = localStorage.getItem("rollNumber");
    const user = getCurrentUser();
    setUserIdentifier(rollNumber || user?.email || "");
  }, []);

  return (
    <AuthGuard allowedRoles={['student']} requireAuth={true} requireRole={true}>
      <DashboardLayout
        userType="student"
        userIdentifier={userIdentifier}
        title="Student Dashboard"
      >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Attendance AI */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/attendai")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Camera className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Attendance AI</CardTitle>
              <CardDescription>Mark attendance using AI</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Open Attendance AI
            </Button>
          </CardContent>
        </Card>

        {/* Issue Hub */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/issuehub")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Issue Hub</CardTitle>
              <CardDescription>Report and track issues</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Open Issue Hub
            </Button>
          </CardContent>
        </Card>

        {/* Room Sync */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/roomsync")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Room Sync</CardTitle>
              <CardDescription>Classroom allocation</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Open Room Sync
            </Button>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <QrCode className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">My QR Code</CardTitle>
              <CardDescription>Personal attendance QR code</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Generate your personal QR code for attendance marking
            </p>
            <Button variant="outline" className="w-full">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">My Schedule</CardTitle>
              <CardDescription>Class timetable</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View your weekly class schedule
            </p>
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Grades/Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <BookOpen className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <CardTitle className="text-lg">Academic Record</CardTitle>
              <CardDescription>Grades and performance</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Check your academic performance
            </p>
            <Button variant="outline" className="w-full">
              View Grades
            </Button>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
