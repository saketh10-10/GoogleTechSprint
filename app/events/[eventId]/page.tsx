"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";

interface Event {
  eventId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, return mock data based on eventId
      // In production, this would call an API to get event details
      const mockEvents: Record<string, Event> = {
        "event-001": {
          eventId: "event-001",
          title: "Data Structures Lecture",
          date: new Date().toISOString().split("T")[0],
          startTime: "09:00",
          endTime: "10:30",
          venue: "Room 101, Block A",
          description:
            "Introduction to data structures and algorithms. This lecture covers fundamental concepts including arrays, linked lists, stacks, and queues.",
        },
        "event-002": {
          eventId: "event-002",
          title: "Database Systems Lab",
          date: new Date().toISOString().split("T")[0],
          startTime: "11:00",
          endTime: "12:30",
          venue: "Computer Lab 2",
          description:
            "Hands-on database design and SQL queries. Students will work on creating database schemas, writing complex queries, and understanding normalization.",
        },
        "event-003": {
          eventId: "event-003",
          title: "Web Development Workshop",
          date: new Date().toISOString().split("T")[0],
          startTime: "14:00",
          endTime: "16:00",
          venue: "Seminar Hall B",
          description:
            "Modern web development techniques and frameworks. Learn about React, Next.js, and modern web development practices.",
        },
      };

      const eventData = mockEvents[eventId];
      if (eventData) {
        setEvent(eventData);
      } else {
        throw new Error("Event not found");
      }
    } catch (err: any) {
      console.error("Error fetching event details:", err);
      setError(err.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!event) return;

    try {
      setGeneratingQR(true);

      // Call API to generate QR code
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.eventId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate QR: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Redirect to QR display page with the QR data
        router.push(
          `/qr-display?payload=${encodeURIComponent(
            data.qrPayload
          )}&expiresAt=${data.expiresAt}&eventTitle=${encodeURIComponent(
            event.title
          )}&eventVenue=${encodeURIComponent(event.venue)}`
        );
      } else {
        throw new Error(data.error || "Failed to generate QR code");
      }
    } catch (err: any) {
      console.error("Error generating QR:", err);
      alert(`Failed to generate QR code: ${err.message}`);
    } finally {
      setGeneratingQR(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard
        allowedRoles={["student", "faculty"]}
        requireAuth={true}
        requireRole={true}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !event) {
    return (
      <AuthGuard
        allowedRoles={["student", "faculty"]}
        requireAuth={true}
        requireRole={true}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The requested event could not be found."}
            </p>
            <Button onClick={() => router.push("/events")} className="w-full">
              Back to Events
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard
      allowedRoles={["student", "faculty"]}
      requireAuth={true}
      requireRole={true}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/events")}
            className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>

          {/* Event Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                  <CardDescription className="text-base">
                    {event.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-4">
                  Today
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5 mr-3 text-red-600" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <Button
                    onClick={handleGenerateQR}
                    disabled={generatingQR}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                  >
                    {generatingQR ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating QR Code...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5 mr-2" />
                        Generate Attendance QR
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                    QR code will be valid for 2 minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  Click "Generate Attendance QR" to create your personal QR code
                </li>
                <li>A QR code will be displayed with a 2-minute countdown</li>
                <li>
                  Show the QR code to the attendance scanner/faculty member
                </li>
                <li>The scanner will validate and mark your attendance</li>
                <li>You'll receive a confirmation once attendance is marked</li>
              </ol>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> Each QR code is unique and
                  single-use. Generate a fresh QR code each time you need to
                  mark attendance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
