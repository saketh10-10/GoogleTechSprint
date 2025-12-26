"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Calendar,
  Building2,
  MessageSquare,
  User,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "event" | "room" | "issue" | "answer";
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  iconColor: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [updateQueue, setUpdateQueue] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced update function
  const updateActivities = useCallback((newActivities: ActivityItem[]) => {
    setUpdateQueue((prev) => [...prev, ...newActivities]);
  }, []);

  // Process queued updates every 500ms
  useEffect(() => {
    if (updateQueue.length === 0) return;

    const timer = setTimeout(() => {
      setActivities((prev) => {
        const combined = [...prev, ...updateQueue];
        // Remove duplicates by ID
        const unique = combined.filter(
          (item, index, self) =>
            self.findIndex((t) => t.id === item.id) === index
        );
        // Sort by timestamp descending
        const sorted = unique.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        // Keep only latest 20 activities
        return sorted.slice(0, 20);
      });
      setUpdateQueue([]);
      setIsLoading(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [updateQueue]);

  useEffect(() => {
    // Real-time listeners for different activity types
    const unsubscribers: (() => void)[] = [];

    // Events listener
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventActivities = snapshot.docs.map((doc) => ({
        id: `event-${doc.id}`,
        type: "event" as const,
        title: "Event Created",
        description: `Event '${doc.data().name}' has been scheduled`,
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: Calendar,
        iconColor: "text-blue-600",
      }));
      updateActivities(eventActivities);
    });
    unsubscribers.push(unsubEvents);

    // Room allocations listener
    const allocationsQuery = query(
      collection(db, "allocations"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubAllocations = onSnapshot(allocationsQuery, (snapshot) => {
      const allocationActivities = snapshot.docs.map((doc) => ({
        id: `room-${doc.id}`,
        type: "room" as const,
        title: "Room Allocated",
        description: `Room ${doc.data().roomNumber} allocated to ${
          doc.data().section
        }`,
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: Building2,
        iconColor: "text-purple-600",
      }));
      updateActivities(allocationActivities);
    });
    unsubscribers.push(unsubAllocations);

    // IssueHub posts listener
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      const postActivities = snapshot.docs.map((doc) => ({
        id: `issue-${doc.id}`,
        type: "issue" as const,
        title: "Question Posted",
        description: doc.data().title || "New question in IssueHub",
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: MessageSquare,
        iconColor: "text-orange-600",
      }));
      updateActivities(postActivities);
    });
    unsubscribers.push(unsubPosts);

    // Answers listener
    const answersQuery = query(
      collection(db, "answers"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubAnswers = onSnapshot(answersQuery, (snapshot) => {
      const answerActivities = snapshot.docs.map((doc) => ({
        id: `answer-${doc.id}`,
        type: "answer" as const,
        title: "Answer Posted",
        description: `${doc.data().authorName} answered in IssueHub`,
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: User,
        iconColor: "text-green-600",
      }));
      updateActivities(answerActivities);
    });
    unsubscribers.push(unsubAnswers);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [updateActivities]);

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-secondary rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          System Activity Feed
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/80`}
                  >
                    <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here in real-time
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
