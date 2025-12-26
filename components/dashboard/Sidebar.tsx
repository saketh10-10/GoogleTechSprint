"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Building2,
  MessageSquare,
  BarChart3,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-service";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProps {
  userType: "student" | "faculty" | "admin";
  userIdentifier: string;
}

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles?: ("student" | "faculty" | "admin")[];
}

export function Sidebar({ userType, userIdentifier }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const navItems: NavItem[] = [
    {
      href: `/dashboard/${userType}`,
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/events",
      icon: Calendar,
      label: "Events",
    },
    {
      href: "/scanner",
      icon: QrCode,
      label: "Attendance",
      roles: ["faculty", "admin"],
    },
    {
      href: "/roomsync",
      icon: Building2,
      label: "RoomSync",
    },
    {
      href: "/issuehub",
      icon: MessageSquare,
      label: "IssueHub",
    },
    {
      href: "#",
      icon: BarChart3,
      label: "Analytics",
      roles: ["faculty", "admin"],
    },
    {
      href: "#",
      icon: FileText,
      label: "Reports",
      roles: ["faculty", "admin"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userType)
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!isCollapsed && (
            <Link href="/" className="text-lg font-semibold tracking-tight">
              EduSync
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto hover:bg-secondary hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        <div className="px-3 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate capitalize">
                  {userType}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userIdentifier}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "#" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-border p-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className={`w-full hover:bg-secondary ${
              isCollapsed ? "px-0 justify-center" : "justify-start"
            }`}
            title={isCollapsed ? "Home" : undefined}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Home</span>}
          </Button>

          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`w-full hover:bg-secondary text-red-600 hover:text-red-700 ${
              isCollapsed ? "px-0 justify-center" : "justify-start"
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
