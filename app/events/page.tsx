"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Loader2, Plus, Trash2 } from "lucide-react";
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
    // 1. Initial setup
    const user = getCurrentUser();
    if (user) {
      const userRole = localStorage.getItem('userType') || localStorage.getItem('userRole');
      setIsFaculty(userRole === 'faculty');
    }

    // 2. Real-time subscription
    const { collection, query, orderBy, onSnapshot, Timestamp } = require('firebase/firestore');
    const { db } = require('@/lib/firebase');

    setLoading(true);
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const liveEvents = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        let dateString = data.date;
        if (data.date instanceof Timestamp) {
          dateString = data.date.toDate().toISOString().split('T')[0];
        }
        return {
          ...data,
          eventId: doc.id,
          date: dateString
        };
      });
      setEvents(liveEvents);
      setLoading(false);
    }, (err: any) => {
      console.error('Events subscription error:', err);
      setError('Failed to sync events. Using offline data.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/events/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();
      if (data.success) {
        setEvents(prev => prev.filter(e => e.eventId !== eventId));
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('An error occurred while deleting the event');
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
            <Button onClick={() => window.location.reload()} className="w-full">
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
                      <div className="flex items-center gap-2">
                        {isFaculty && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteEvent(e, event.eventId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Badge variant="secondary">Today</Badge>
                      </div>
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
