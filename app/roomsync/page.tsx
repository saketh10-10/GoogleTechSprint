"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Plus,
  Calendar,
  Users,
  Sparkles,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";
import { doc, getDoc, collection, addDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

// Data types
interface Room {
  roomId: string;
  roomName: string;
  capacity: number;
  roomType: 'classroom' | 'lab' | 'seminar';
  isActive: boolean;
  createdAt: Date;
}

interface Section {
  sectionId: string;
  department: string;
  sectionName: string;
  classStrength: number;
  requiredRoomType?: 'classroom' | 'lab' | 'seminar';
  createdAt: Date;
}

interface Allocation {
  allocationId: string;
  roomId: string;
  sectionId: string;
  date: string;
  startTime: string;
  endTime: string;
  allocatedBy: string;
  createdAt: Date;
  roomName?: string;
  sectionName?: string;
}

const RoomSyncPage = memo(function RoomSyncPage() {
  const router = useRouter();

  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Data state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [tabDataLoaded, setTabDataLoaded] = useState({
    rooms: false,
    sections: false,
    allocation: false,
    dashboard: false
  });

  // Form states
  const [newRoom, setNewRoom] = useState({
    roomName: "",
    capacity: "",
    roomType: "classroom" as 'classroom' | 'lab' | 'seminar'
  });

  const [newSection, setNewSection] = useState({
    department: "",
    sectionName: "",
    classStrength: "",
    requiredRoomType: "classroom" as 'classroom' | 'lab' | 'seminar'
  });

  const [allocationForm, setAllocationForm] = useState({
    sectionId: "",
    date: "",
    startTime: "",
    endTime: ""
  });

  const [suggestedRooms, setSuggestedRooms] = useState<Room[]>([]);
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...');

  // Network status detection
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOffline(false);
      console.log('Connection restored - switching to online mode');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOffline(true);
      console.log('Connection lost - switching to offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setIsOnline(navigator.onLine);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Authentication check - Optimized for fast initial response
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Quick check: Try to use cached role for immediate UI response
      const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;

      if (cachedRole) {
        setUserRole(cachedRole);
        setIsAuthorized(true);
        setIsLoading(false); // Stop showing the main loader early
        if (cachedRole === 'student') setActiveTab('dashboard');
        setLoadingProgress('Validating session...');
      }

      const user = getCurrentUser();
      if (!user) {
        // Only redirect if we don't even have a cached user
        if (!cachedUser) {
          router.push("/login");
          return;
        }
      } else {
        setCurrentUser(user);
        if (typeof window !== 'undefined') localStorage.setItem('authUser', JSON.stringify({ uid: user.uid, email: user.email }));
      }

      // 2. Background validation: Verify role from Firestore
      try {
        if (!user) return; // Wait for user if not loaded yet

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;

          localStorage.setItem('userRole', role);
          setUserRole(role);
          setIsAuthorized(true);

          if (!cachedRole && role === 'student') {
            setActiveTab('dashboard');
          }
        } else if (!cachedRole) {
          router.push('/login');
          return;
        }
      } catch (error: any) {
        console.warn('Background role validation failed:', error.message);
        // If we have a cached role, we're already authorized, so we just continue
        if (!cachedRole) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
        setLoadingProgress('');
      }
    };

    checkAuth();
  }, [router]);


  // Memoized computed values for performance optimization
  const activeRooms = useMemo(() => rooms.filter(room => room.isActive), [rooms]);

  const enrichedAllocations = useMemo(() => {
    return allocations.map(allocation => ({
      ...allocation,
      roomName: rooms.find(r => r.roomId === allocation.roomId)?.roomName || 'Unknown Room',
      sectionName: sections.find(s => s.sectionId === allocation.sectionId)?.sectionName || 'Unknown Section'
    }));
  }, [allocations, rooms, sections]);

  // Real-time synchronization
  useEffect(() => {
    if (!isAuthorized) return;

    console.log('Establishing real-time RoomSync listeners...');
    const { collection, query, orderBy, onSnapshot, where, limit } = require('firebase/firestore');

    // 1. Rooms listener
    const roomsQuery = query(collection(db, 'rooms'), orderBy('roomName', 'asc'));
    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot: any) => {
      const roomsData = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        roomId: doc.id
      })) as Room[];
      setRooms(roomsData);
    });

    // 2. Sections listener
    const sectionsQuery = query(collection(db, 'sections'), orderBy('createdAt', 'desc'));
    const unsubscribeSections = onSnapshot(sectionsQuery, (snapshot: any) => {
      const sectionsData = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        sectionId: doc.id
      })) as Section[];
      setSections(sectionsData);
    });

    // 3. Allocations listener (filtered by dashboard date)
    const targetDate = allocationForm.date || new Date().toISOString().split('T')[0];
    const allocationsQuery = query(
      collection(db, 'allocations'),
      where('date', '==', targetDate),
      orderBy('startTime', 'asc'),
      limit(50)
    );

    const unsubscribeAllocations = onSnapshot(allocationsQuery, (snapshot: any) => {
      const allocationsData = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        allocationId: doc.id
      })) as Allocation[];
      setAllocations(allocationsData);
      setDataLoading(false);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeSections();
      unsubscribeAllocations();
    };
  }, [isAuthorized, allocationForm.date]);

  // Lazy loading for tabs - Just switches the UI state now as listeners handle data
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Load cached data for offline scenarios
  const loadCachedData = () => {
    try {
      const cachedRooms = localStorage.getItem('cachedRooms');
      const cachedSections = localStorage.getItem('cachedSections');
      const cachedAllocations = localStorage.getItem('cachedAllocations');

      if (cachedRooms) {
        setRooms(JSON.parse(cachedRooms));
        console.log('Loaded rooms from cache');
      }

      if (cachedSections) {
        setSections(JSON.parse(cachedSections));
        console.log('Loaded sections from cache');
      }

      if (cachedAllocations) {
        const allocationsData = JSON.parse(cachedAllocations);
        // Enrich cached allocations with room/section names
        const enrichedAllocations = allocationsData.map((allocation: any) => ({
          ...allocation,
          roomName: rooms.find(r => r.roomId === allocation.roomId)?.roomName || 'Unknown Room',
          sectionName: sections.find(s => s.sectionId === allocation.sectionId)?.sectionName || 'Unknown Section'
        }));
        setAllocations(enrichedAllocations);
        console.log('Loaded allocations from cache');
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  // Optimized data fetching functions with useCallback for performance

  // Form handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createRoomFunction = httpsCallable(functions, 'createRoom');
      const result = (await createRoomFunction({
        roomName: newRoom.roomName,
        capacity: parseInt(newRoom.capacity),
        roomType: newRoom.roomType
      })) as any;

      if (result.data.success) {
        setNewRoom({ roomName: "", capacity: "", roomType: "classroom" });
        // Real-time listener handles the update
        alert('Room created successfully!');
      } else {
        alert(result.data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }

    setLoading(false);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createSectionFunction = httpsCallable(functions, 'createSection');
      const result = (await createSectionFunction({
        department: newSection.department,
        sectionName: newSection.sectionName,
        classStrength: parseInt(newSection.classStrength),
        requiredRoomType: newSection.requiredRoomType
      })) as any;

      if (result.data.success) {
        setNewSection({ department: "", sectionName: "", classStrength: "", requiredRoomType: "classroom" });
        // Real-time listener handles the update
        alert('Section created successfully!');
      } else {
        alert(result.data.error || 'Failed to create section');
      }
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }

    setLoading(false);
  };

  const handleGetSuggestions = async () => {
    if (!allocationForm.sectionId) {
      alert('Please select a section first');
      return;
    }

    const section = sections.find(s => s.sectionId === allocationForm.sectionId);
    if (!section) return;

    try {
      const suggestRoomsFunction = httpsCallable(functions, 'suggestRooms');
      const result = (await suggestRoomsFunction({
        sectionStrength: section.classStrength,
        duration: 60, // Default 1 hour
        roomType: section.requiredRoomType || 'classroom'
      })) as any;

      if (result.data.success) {
        setSuggestedRooms(result.data.rooms || []);
      } else {
        alert(result.data.error || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      alert('Failed to get room suggestions');
    }
  };

  const handleAllocateRoom = async (roomId: string) => {
    if (!allocationForm.sectionId || !allocationForm.date || !allocationForm.startTime || !allocationForm.endTime) {
      alert('Please fill all allocation details');
      return;
    }

    setLoading(true);

    try {
      const allocateRoomFunction = httpsCallable(functions, 'allocateRoom');
      const result = (await allocateRoomFunction({
        roomId,
        sectionId: allocationForm.sectionId,
        date: allocationForm.date,
        startTime: allocationForm.startTime,
        endTime: allocationForm.endTime
      })) as any;

      if (result.data.success) {
        setAllocationForm({ sectionId: "", date: "", startTime: "", endTime: "" });
        setSuggestedRooms([]);
        // Real-time listener handles the update
        alert('Room allocated successfully!');
      } else {
        alert(result.data.error || 'Failed to allocate room');
      }
    } catch (error) {
      console.error('Error allocating room:', error);
      alert('Failed to allocate room');
    }

    setLoading(false);
  };


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

  // Show data loading state
  if (dataLoading) {
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
                {userRole || 'User'} Portal
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/login')}
                className="hover:bg-secondary"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-medium text-foreground">RoomSync</h1>
              </div>
              <p className="text-muted-foreground">
                AI-Powered Room Management & Allocation System
              </p>
            </div>

            {/* Loading State */}
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                <h3 className="text-lg font-medium mb-2">Loading RoomSync</h3>
                <p className="text-muted-foreground mb-2">
                  {loadingProgress || 'Initializing...'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Please wait while we load your data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground capitalize">
              {userRole || 'User'} Portal
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/login')}
              className="hover:bg-secondary"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-medium text-foreground">RoomSync</h1>
              </div>
              <div className="flex items-center gap-3">
                {lastDataRefresh && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {lastDataRefresh.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">
              {userRole === 'student'
                ? "View your room allocations and schedules"
                : "AI-Powered Room Management & Allocation System"}
            </p>
          </div>

          {!isOnline && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="text-yellow-600 dark:text-yellow-400">📡</div>
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    You're Offline
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Using cached data. Some features may be limited until connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className={`grid w-full ${userRole === 'student' ? 'grid-cols-1' : 'grid-cols-4'}`}>
              {(userRole === 'faculty' || userRole === 'admin') && (
                <>
                  <TabsTrigger value="rooms">Room Management</TabsTrigger>
                  <TabsTrigger value="sections">Section Management</TabsTrigger>
                  <TabsTrigger value="allocation">Room Allocation</TabsTrigger>
                </>
              )}
              <TabsTrigger value="dashboard">
                {userRole === 'student' ? 'Current Allocations' : 'Allocation Dashboard'}
              </TabsTrigger>
            </TabsList>

            {/* Room Management Tab */}
            <TabsContent value="rooms" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Add Room Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Room
                    </CardTitle>
                    <CardDescription>
                      Register a new room for the allocation system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input
                          id="roomName"
                          placeholder="e.g., Room 101"
                          value={newRoom.roomName}
                          onChange={(e) => setNewRoom({ ...newRoom, roomName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          placeholder="e.g., 50"
                          value={newRoom.capacity}
                          onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                          required
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roomType">Room Type</Label>
                        <Select value={newRoom.roomType} onValueChange={(value: any) => setNewRoom({ ...newRoom, roomType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classroom">Classroom</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="seminar">Seminar Hall</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Room"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Rooms List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Rooms</CardTitle>
                    <CardDescription>
                      All registered rooms in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeRooms.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No rooms registered yet</p>
                      ) : (
                        activeRooms.map((room) => (
                          <div key={room.roomId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{room.roomName}</p>
                              <p className="text-sm text-muted-foreground">
                                Capacity: {room.capacity} • Type: {room.roomType}
                              </p>
                            </div>
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Section Management Tab */}
            <TabsContent value="sections" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Add Section Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Section
                    </CardTitle>
                    <CardDescription>
                      Register a new class section for room allocation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateSection} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          placeholder="e.g., Computer Science"
                          value={newSection.department}
                          onChange={(e) => setNewSection({ ...newSection, department: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sectionName">Section Name</Label>
                        <Input
                          id="sectionName"
                          placeholder="e.g., CS-A"
                          value={newSection.sectionName}
                          onChange={(e) => setNewSection({ ...newSection, sectionName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="classStrength">Class Strength</Label>
                        <Input
                          id="classStrength"
                          type="number"
                          placeholder="e.g., 45"
                          value={newSection.classStrength}
                          onChange={(e) => setNewSection({ ...newSection, classStrength: e.target.value })}
                          required
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="requiredRoomType">Required Room Type</Label>
                        <Select value={newSection.requiredRoomType} onValueChange={(value: any) => setNewSection({ ...newSection, requiredRoomType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classroom">Classroom</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="seminar">Seminar Hall</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Section"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Sections List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Sections</CardTitle>
                    <CardDescription>
                      All registered sections in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sections.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No sections registered yet</p>
                      ) : (
                        sections.map((section) => (
                          <div key={section.sectionId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{section.sectionName}</p>
                              <p className="text-sm text-muted-foreground">
                                {section.department} • Strength: {section.classStrength}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requires: {section.requiredRoomType}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Room Allocation Tab */}
            <TabsContent value="allocation" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Allocation Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Allocate Room
                    </CardTitle>
                    <CardDescription>
                      Allocate a room for a section with AI assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Select Section</Label>
                      <Select value={allocationForm.sectionId} onValueChange={(value) => setAllocationForm({ ...allocationForm, sectionId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.sectionId} value={section.sectionId}>
                              {section.sectionName} ({section.classStrength} students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={allocationForm.date}
                        onChange={(e) => setAllocationForm({ ...allocationForm, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={allocationForm.startTime}
                          onChange={(e) => setAllocationForm({ ...allocationForm, startTime: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={allocationForm.endTime}
                          onChange={(e) => setAllocationForm({ ...allocationForm, endTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGetSuggestions}
                      className="w-full"
                      variant="outline"
                      disabled={!allocationForm.sectionId}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI Room Suggestions
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Room Suggestions
                    </CardTitle>
                    <CardDescription>
                      Recommended rooms based on your requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestedRooms.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Click "Get AI Room Suggestions" to see recommendations
                        </p>
                      ) : (
                        suggestedRooms.map((room) => (
                          <div key={room.roomId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{room.roomName}</p>
                              <p className="text-sm text-muted-foreground">
                                Capacity: {room.capacity} • Type: {room.roomType}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAllocateRoom(room.roomId)}
                              disabled={loading}
                            >
                              {loading ? "Allocating..." : "Allocate"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Allocation Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader className="flex md:flex-row items-center justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Room Allocation Dashboard
                    </CardTitle>
                    <CardDescription>
                      View room occupancy for {allocationForm.date}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">View Day:</span>
                    <Input
                      type="date"
                      value={allocationForm.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setAllocationForm(prev => ({ ...prev, date: newDate }));
                      }}
                      className="max-w-[150px] bg-secondary/30"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrichedAllocations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No allocations found</p>
                    ) : (
                      enrichedAllocations.map((allocation) => (
                        <div key={allocation.allocationId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                            <div>
                              <p className="text-sm text-muted-foreground">Room</p>
                              <p className="font-medium">{allocation.roomName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Section</p>
                              <p className="font-medium">{allocation.sectionName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium">{allocation.date}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Time</p>
                              <p className="font-medium">{allocation.startTime} - {allocation.endTime}</p>
                            </div>
                          </div>
                          {(userRole === 'faculty' || userRole === 'admin') && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
});

RoomSyncPage.displayName = 'RoomSyncPage';

export default RoomSyncPage;