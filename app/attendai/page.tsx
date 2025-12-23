"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  AlertCircle,
} from "lucide-react";
import { QRCodeDisplay } from "@/components/attendai/qr-code-display";
import { getCurrentUser } from "@/lib/auth-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mock events data
const todayEvents = [
  {
    id: "1",
    title: "Advanced Algorithms Lecture",
    time: "09:00 AM - 10:30 AM",
    location: "Room 301, CS Building",
    instructor: "Dr. Sarah Johnson",
    attendees: 45,
    status: "upcoming" as const,
  },
  {
    id: "2",
    title: "Machine Learning Workshop",
    time: "11:00 AM - 01:00 PM",
    location: "Lab 205, AI Center",
    instructor: "Prof. Michael Chen",
    attendees: 30,
    status: "upcoming" as const,
  },
  {
    id: "3",
    title: "Database Systems Tutorial",
    time: "02:00 PM - 03:30 PM",
    location: "Room 402, CS Building",
    instructor: "Dr. Emily Rodriguez",
    attendees: 38,
    status: "upcoming" as const,
  },
  {
    id: "4",
    title: "Web Development Seminar",
    time: "04:00 PM - 05:30 PM",
    location: "Auditorium A",
    instructor: "Prof. David Park",
    attendees: 60,
    status: "upcoming" as const,
  },
];

export default function AttendAIPage() {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    setShowQR(true);
  };

  const handleBack = () => {
    setShowQR(false);
    setSelectedEvent(null);
  };

  const selectedEventData = todayEvents.find((e) => e.id === selectedEvent);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const user = getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check user role
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'student' || userData.role === 'faculty') {
            setIsAuthorized(true);
          } else {
            router.push('/unauthorized');
          }
        } else {
          // User document doesn't exist - redirect to login
          console.warn('User document not found, redirecting to login');
          router.push('/login');
        }
      } catch (error: any) {
        console.error('Error checking user role:', error);

        // Handle different types of errors
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          // Network connectivity issue - allow access but show warning
          console.warn('Network connectivity issue, allowing access with limited functionality');
          setIsOffline(true);
          setIsAuthorized(true); // Allow access but with limited functionality
        } else if (error.code === 'permission-denied') {
          // Firestore security rules blocking access
          console.error('Permission denied accessing user document');
          router.push('/login');
        } else {
          // Other errors - redirect to login
          console.error('Unknown error accessing user document:', error.code);
          router.push('/login');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-foreground">AttendAI</h1>
              <p className="text-xs text-muted-foreground">
                AI-Powered Attendance System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Student Portal
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {isOffline && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ You appear to be offline. Some features may have limited functionality.
            </p>
          </div>
        )}

        {!showQR ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-3xl font-medium text-foreground">
                  Today's Events
                </h2>
              </div>
              <p className="text-muted-foreground">
                Select an event to generate your unique attendance QR code
              </p>
            </div>

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {todayEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-6 bg-card border-secondary hover:border-primary/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleEventSelect(event.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {event.instructor}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary">
                      {event.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} students enrolled</span>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Generate QR Code
                  </Button>
                </Card>
              ))}
            </div>

            {/* Info Section */}
            <Card className="mt-8 p-6 bg-card border-secondary">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    How It Works
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Select an event to generate your unique, non-shareable
                        QR code
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Screenshots are disabled to prevent misuse and ensure
                        attendance integrity
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Once scanned, an automatic email confirmation is sent to
                        the designated authority
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Each QR code is time-limited and expires after the event
                        ends
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* QR Code View */}
            {selectedEventData && (
              <div className="max-w-2xl mx-auto">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Button>

                <Card className="p-8 bg-card border-secondary">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-medium text-foreground mb-2">
                      {selectedEventData.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedEventData.instructor}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 p-4 rounded-xl bg-secondary/50">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Time</span>
                      </div>
                      <p className="text-sm text-foreground">
                        {selectedEventData.time}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                      <p className="text-sm text-foreground">
                        {selectedEventData.location}
                      </p>
                    </div>
                  </div>

                  {/* QR Code Component */}
                  <QRCodeDisplay
                    eventId={selectedEventData.id}
                    eventTitle={selectedEventData.title}
                  />

                  <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">
                          Email Notification
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Once your QR code is scanned, an automated email will
                          be sent to the course instructor confirming your
                          attendance.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">
                          Security Notice
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          This QR code is unique to you and cannot be shared.
                          Screenshots are disabled on this page. The code
                          expires at the end of the event.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
