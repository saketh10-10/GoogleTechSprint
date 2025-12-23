"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

    setUserType(storedUserType || "");
    setUserIdentifier(storedRollNumber || storedEmail || user.email || "");
    setIsLoading(false);
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem("userType");
      localStorage.removeItem("rollNumber");
      localStorage.removeItem("email");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>
                You are logged in as a{" "}
                {userType === "student" ? "Student" : "Faculty Member"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userType === "student" ? "Roll Number:" : "Email:"}
                </p>
                <p className="text-lg font-semibold">{userIdentifier}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Access your tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/attendai")}
              >
                AttendAI
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/issuehub")}
              >
                IssueHub
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/roomsync")}
              >
                RoomSync
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Account Type
                  </p>
                  <p className="font-medium capitalize">{userType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Welcome to the KLH Portal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                This is your dashboard. You can access various features and
                tools from here. Use the quick links above to navigate to
                different sections of the portal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
