"use client";

import { useEffect, useState } from "react";
import { DataService } from "@/lib/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Building2, QrCode } from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: Date;
  venue: string;
  time?: string;
}

interface Allocation {
  id: string;
  roomNumber: string;
  section: string;
  subject: string;
}

export function TodayOverview() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [activeQRSession, setActiveQRSession] = useState<any>(null);
  const [pendingAllocations, setPendingAllocations] = useState<Allocation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      // Use optimized DataService with caching
      const overview = await DataService.getTodayOverview();

      setUpcomingEvents(overview.upcomingEvents);
      setPendingAllocations(overview.todayAllocations);

      // Check for active QR session
      const now = new Date();
      const activeEvent = overview.upcomingEvents.find((event) => {
        const eventDate = new Date(event.date);
        const timeDiff = Math.abs(now.getTime() - eventDate.getTime());
        return timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
      });

      setActiveQRSession(overview.activeQRSession || activeEvent);
    } catch (error) {
      console.error("Error fetching today's data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-secondary rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-secondary rounded"></div>
            <div className="h-16 bg-secondary rounded"></div>
            <div className="h-16 bg-secondary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Today's Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Events */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Upcoming Events
          </h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time ||
                          event.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.venue}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3">
              No upcoming events
            </p>
          )}
        </div>

        {/* Active QR Session */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Active QR Session
          </h3>
          {activeQRSession ? (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {activeQRSession.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Attendance collection active
                  </p>
                  <Badge className="mt-2 bg-green-600 hover:bg-green-700">
                    Live
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3">
              No active QR sessions
            </p>
          )}
        </div>

        {/* Pending Room Allocations */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Today's Room Allocations
          </h3>
          {pendingAllocations.length > 0 ? (
            <div className="space-y-2">
              {pendingAllocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {allocation.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {allocation.section}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{allocation.subject}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3">
              No allocations for today
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
