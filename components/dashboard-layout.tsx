"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QrCode,
  Building2,
  MessageSquare,
  LogOut,
  User,
  Home,
  ArrowRight,
} from "lucide-react";
import { signOut } from "@/lib/auth-service";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: string;
  userIdentifier: string;
  title?: string;
}

export function DashboardLayout({
  children,
  userType,
  userIdentifier,
  title = "Dashboard"
}: DashboardLayoutProps) {
  const router = useRouter();

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

  const navigationItems = [
    {
      href: "/attendai",
      icon: QrCode,
      title: "AttendAI",
      description: "Attendance management system"
    },
    {
      href: "/issuehub",
      icon: MessageSquare,
      title: "IssueHub",
      description: "Community Q&A platform"
    },
    {
      href: "/roomsync",
      icon: Building2,
      title: "RoomSync",
      description: userType === "student" ? "Room allocation info" : "Room management system"
    }
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-medium text-foreground tracking-tight"
            >
              AttendAI
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground capitalize">
              {userType} Portal
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hover:bg-secondary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-medium text-foreground">{title}</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {userType === "student" ? "Student" : "Faculty Member"} • {userIdentifier}
            </p>
          </div>

          {/* User Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                  <p className="font-medium capitalize">{userType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {userType === "student" ? "Roll Number" : "Email"}
                  </p>
                  <p className="font-medium">{userIdentifier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {item.title}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Custom Content */}
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 AttendAI. Google TechSprint Project.
          </p>
        </div>
      </footer>
    </div>
  );
}
