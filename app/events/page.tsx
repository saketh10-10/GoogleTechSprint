"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Loader2, Plus } from "lucide-react";
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

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFaculty, setIsFaculty] = useState(false);

  useEffect(() => {
    fetchTodaysEvents();
    // Check if user is faculty to show create event button
    const user = getCurrentUser();
    if (user) {
      // For development, check localStorage role
      const userRole = localStorage.getItem('userType') || localStorage.getItem('userRole');
      setIsFaculty(userRole === 'faculty');
    }
  }, []);

  const fetchTodaysEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Cloud Function to get today's events
      const result = await fetch('/api/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch events: ${result.status}`);
      }

      const data = await result.json();

      if (data.success) {
        setEvents(data.events);
      } else {
        throw new Error(data.error || 'Failed to load events');
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['student', 'faculty']} requireAuth={true} requireRole={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading today's events...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard allowedRoles={['student', 'faculty']} requireAuth={true} requireRole={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to Load Events</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTodaysEvents} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student', 'faculty']} requireAuth={true} requireRole={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Today's Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {events.length > 0
                  ? `Found ${events.length} event${events.length === 1 ? '' : 's'} scheduled for today`
                  : 'No events scheduled for today'
                }
              </p>
            </div>
            {isFaculty && (
              <Button
                onClick={() => router.push('/events/create')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Events Today
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no events scheduled for today. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card
                  key={event.eventId}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleEventClick(event.eventId)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {event.description || 'No description available'}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        Today
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.startTime} - {event.endTime}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.venue}
                      </div>

                      <Button
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event.eventId);
                        }}
                      >
                        View Details & Generate QR
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
