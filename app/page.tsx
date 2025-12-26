"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Building2,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  LogOut,
  User,
  Calendar,
  Home,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoSection } from "@/components/demo-section";
import { getCurrentUser, signOut } from "@/lib/auth-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [userIdentifier, setUserIdentifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    const storedUserType = localStorage.getItem("userType");
    const rollNumber = localStorage.getItem("rollNumber");
    const email = localStorage.getItem("email");

    if (user && storedUserType) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
      setUserIdentifier(rollNumber || email || user.email || "");
    }
    setIsLoading(false);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem("userType");
      localStorage.removeItem("rollNumber");
      localStorage.removeItem("email");
      localStorage.removeItem("userRole");
      setIsLoggedIn(false);
      setUserType("");
      setUserIdentifier("");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Navigation items for logged-in users
  const navigationItems = [
    {
      href: "/events",
      icon: Calendar,
      title: "Events",
      description: "Today's events and attendance",
    },
    {
      href: "/issuehub",
      icon: MessageSquare,
      title: "IssueHub",
      description: "Community Q&A platform",
    },
    {
      href: "/roomsync",
      icon: Building2,
      title: "RoomSync",
      description:
        userType === "student"
          ? "Room allocation info"
          : "Room management system",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show logged-in view
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Navigation for logged-in users */}
        <nav className="fixed top-0 w-full z-50 border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-xl font-medium text-foreground tracking-tight"
              >
                EduSync
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="hover:bg-secondary"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">
                  {userType}
                </span>
              </div>
              <ThemeToggle />
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

        {/* Main Content for logged-in users */}
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-4">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">
                  Welcome Back!
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
                {userType === "student" ? "Student" : "Faculty"} Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                {userType === "student" ? "Student" : "Faculty Member"} •{" "}
                {userIdentifier}
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
                    <p className="text-sm text-muted-foreground mb-1">
                      Account Type
                    </p>
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
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Cards */}
            <div className="mb-8">
              <h2 className="text-2xl font-medium text-foreground mb-6">
                Access Your Tools
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
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
            </div>

            {/* Information Section */}
            <div className="text-center py-8 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">
                Use the navigation cards above to access Events, Issue Hub, and
                Room Sync features.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-6 mt-20">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 EduSync. Google TechSprint Project.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Show guest view (original homepage)
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
              EduSync
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" className="hover:bg-secondary" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              asChild
            >
              <Link href="/events">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">
              Google TechSprint 2025
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground mb-6 text-balance">
            AI-Powered Campus Management
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Transform your college experience with intelligent attendance
            tracking, optimized room allocation, and a collaborative community
            platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              asChild
            >
              <Link href="/events">
                Start Using EduSync
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border rounded-full hover:bg-secondary"
              asChild
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
              Three Powerful Solutions
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose the tool that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Events/Attendance Card */}
            <Link href="/events" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-200">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-medium text-foreground mb-3">
                  Events & Attendance
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  AI-powered attendance system with secure QR codes, event
                  tracking, and automated email notifications.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    QR Generation
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Event Tracking
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Auto Emails
                  </span>
                </div>

                <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-200">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>

            {/* RoomSync Card */}
            <Link href="/roomsync" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-200">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-medium text-foreground mb-3">
                  RoomSync
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Intelligent room allocation platform with AI-based suggestions
                  for optimal space utilization.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    AI Suggestions
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Admin Only
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Live Updates
                  </span>
                </div>

                <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-200">
                  <span>Official access</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>

            {/* IssueHub Card */}
            <Link href="/issuehub" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-200">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-medium text-foreground mb-3">
                  IssueHub
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Collaborative community platform where students share
                  knowledge and solve campus issues together.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Q&A Forum
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Community
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                    Knowledge Base
                  </span>
                </div>

                <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-200">
                  <span>Join community</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="relative">
        <DemoSection />
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                Lightning Fast
              </h3>
              <p className="text-muted-foreground">
                Quick QR generation and instant room allocation with AI
                optimization
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                Secure & Private
              </h3>
              <p className="text-muted-foreground">
                Non-shareable QR codes with screenshot protection for attendance
                integrity
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                AI-Powered
              </h3>
              <p className="text-muted-foreground">
                Smart suggestions and automated workflows powered by artificial
                intelligence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 EduSync. Google TechSprint Project.
          </p>
        </div>
      </footer>
    </div>
  );
}
