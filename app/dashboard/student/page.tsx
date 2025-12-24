"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { getCurrentUser } from "@/lib/auth-service";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Room interface
interface Room {
  roomId: string;
  roomName: string;
  capacity: number;
  roomType: 'classroom' | 'lab' | 'seminar';
  isActive: boolean;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [userIdentifier, setUserIdentifier] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available rooms
  const fetchRooms = async () => {
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const roomsData = querySnapshot.docs
        .map(doc => ({
          ...doc.data(),
          roomId: doc.id
        })) as Room[]
        .filter(room => room.isActive); // Only show active rooms

      setRooms(roomsData);

      // Cache rooms for offline access
      localStorage.setItem('studentRooms', JSON.stringify(roomsData));
    } catch (error) {
      console.error('Error fetching rooms:', error);

      // Try to load from cache
      const cachedRooms = localStorage.getItem('studentRooms');
      if (cachedRooms) {
        try {
          setRooms(JSON.parse(cachedRooms));
        } catch (parseError) {
          console.error('Error parsing cached rooms:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get student identifier from localStorage or user data
    const rollNumber = localStorage.getItem("rollNumber");
    const user = getCurrentUser();
    setUserIdentifier(rollNumber || user?.email || "");

    // Fetch rooms data
    fetchRooms();
  }, []);

  return (
    <AuthGuard allowedRoles={['student']} requireAuth={true} requireRole={true}>
      <DashboardLayout
        userType="student"
        userIdentifier={userIdentifier}
        title="Student Dashboard"
      >
      {/* Available Rooms Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Available Rooms</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rooms available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.roomId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.roomName}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {room.roomType}
                    </Badge>
                  </div>
                  <CardDescription>
                    Room information and capacity details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Capacity: {room.capacity} students</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      This room can accommodate up to {room.capacity} students and is suitable for {room.roomType} activities.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Use the navigation cards above to access Events and Issue Hub. Room allocations are managed by faculty.
        </p>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
