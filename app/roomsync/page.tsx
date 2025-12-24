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
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";
import { doc, getDoc, collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
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

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const user = getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);

      // Try to get user role from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;

          // Store role locally for offline access
          localStorage.setItem('userRole', userRole);

          if (userRole === 'faculty' || userRole === 'admin') {
            setIsAuthorized(true);
          } else {
            // Students cannot access RoomSync
            router.push('/unauthorized');
            return;
          }
        } else {
          // User document doesn't exist - redirect to login
          console.warn('User document not found, redirecting to login');
          router.push('/login');
          return;
        }
      } catch (error: any) {
        console.warn('Error checking user role from Firestore:', error.message);

        // Handle offline/network errors by using cached role
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          console.log('Offline mode detected, using cached user role');

          // Try to get role from localStorage as fallback
          const cachedRole = localStorage.getItem('userRole');

          if (cachedRole === 'faculty' || cachedRole === 'admin') {
            console.log('Using cached role for offline access');
            setIsOffline(true);
            setIsAuthorized(true);
          } else {
            console.warn('No valid cached role found, redirecting to login');
            router.push('/login');
            return;
          }
        } else if (error.code === 'permission-denied') {
          // Firestore security rules blocking access
          console.error('Permission denied accessing user document');
          router.push('/login');
          return;
        } else {
          // Other errors - redirect to login
          console.error('Unknown error accessing user document:', error.code);
          router.push('/login');
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Optimized manual refresh function with parallel loading
  const refreshData = async () => {
    if (!isOnline) {
      alert('Cannot refresh data while offline');
      return;
    }

    setDataLoading(true);
    try {
      console.log('Manually refreshing data in parallel...');
      const startTime = Date.now();

      await Promise.all([
        fetchRooms(),
        fetchSections(),
        fetchAllocations()
      ]);

      const endTime = Date.now();
      setLastDataRefresh(new Date());
      console.log(`Data refresh completed in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please check your connection.');
    } finally {
      setDataLoading(false);
    }
  };

  // Memoized computed values for performance optimization
  const activeRooms = useMemo(() => rooms.filter(room => room.isActive), [rooms]);

  const enrichedAllocations = useMemo(() => {
    return allocations.map(allocation => ({
      ...allocation,
      roomName: rooms.find(r => r.roomId === allocation.roomId)?.roomName || 'Unknown Room',
      sectionName: sections.find(s => s.sectionId === allocation.sectionId)?.sectionName || 'Unknown Section'
    }));
  }, [allocations, rooms, sections]);

  // Optimized parallel data loading for faster performance
  useEffect(() => {
    if (isAuthorized) {
      const loadData = async () => {
        setDataLoading(true);
        try {
          if (isOnline) {
            // Load all data in parallel for maximum speed
            console.log('Loading RoomSync data...');
            const startTime = Date.now();

            setLoadingProgress('Fetching rooms...');
            const roomsPromise = fetchRooms();

            setLoadingProgress('Fetching sections...');
            const sectionsPromise = fetchSections();

            setLoadingProgress('Fetching allocations...');
            const allocationsPromise = fetchAllocations();

            // Wait for all to complete
            await Promise.all([roomsPromise, sectionsPromise, allocationsPromise]);

            const endTime = Date.now();
            console.log(`All data loaded in ${endTime - startTime}ms`);

            setLoadingProgress('Data loaded successfully!');
            setLastDataRefresh(new Date());
          } else {
            // Load cached data immediately when offline
            setLoadingProgress('Loading cached data...');
            console.log('Loading cached data for offline mode...');
            loadCachedData();
            setLoadingProgress('Offline mode ready');
          }
        } catch (error) {
          console.error('Error loading data:', error);
          setLoadingProgress('Loading from cache...');
          // Try to load cached data as fallback
          loadCachedData();
        } finally {
          // Keep loading state for a moment to show completion
          setTimeout(() => {
            setDataLoading(false);
            setLoadingProgress('');
          }, 500);
        }
      };

      loadData();
    }
  }, [isAuthorized, isOnline]);

  // Lazy loading for tabs - load data only when tab is accessed
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    // Mark tab as loaded
    setTabDataLoaded(prev => ({
      ...prev,
      [tab]: true
    }));

    // If switching to allocation tab and no suggestions loaded, load them
    if (tab === 'allocation' && suggestedRooms.length === 0) {
      // Load AI suggestions when allocation tab is opened
      // This will be triggered when user selects a section
    }
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
  const fetchRooms = useCallback(async () => {
    if (!isOnline) {
      console.log('Skipping room fetch - offline mode');
      return;
    }

    try {
      console.log('Fetching rooms from Firestore...');
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const roomsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        roomId: doc.id
      })) as Room[];

      console.log(`Fetched ${roomsData.length} rooms`);
      setRooms(roomsData);

      // Cache rooms locally for offline access
      localStorage.setItem('cachedRooms', JSON.stringify(roomsData));
    } catch (error: any) {
      console.error('Error fetching rooms:', error);

      // Try to load from cache if available
      const cachedRooms = localStorage.getItem('cachedRooms');
      if (cachedRooms) {
        try {
          const cachedData = JSON.parse(cachedRooms);
          setRooms(cachedData);
          console.log('Loaded rooms from cache');
        } catch (parseError) {
          console.error('Error parsing cached rooms:', parseError);
        }
      }
    }
  }, [isOnline]);

  const fetchSections = useCallback(async () => {
    if (!isOnline) {
      console.log('Skipping section fetch - offline mode');
      return;
    }

    try {
      console.log('Fetching sections from Firestore...');
      const sectionsRef = collection(db, 'sections');
      const q = query(sectionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const sectionsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        sectionId: doc.id
      })) as Section[];

      console.log(`Fetched ${sectionsData.length} sections`);
      setSections(sectionsData);

      // Cache sections locally for offline access
      localStorage.setItem('cachedSections', JSON.stringify(sectionsData));
    } catch (error: any) {
      console.error('Error fetching sections:', error);

      // Try to load from cache if available
      const cachedSections = localStorage.getItem('cachedSections');
      if (cachedSections) {
        try {
          const cachedData = JSON.parse(cachedSections);
          setSections(cachedData);
          console.log('Loaded sections from cache');
        } catch (parseError) {
          console.error('Error parsing cached sections:', parseError);
        }
      }
    }
  }, [isOnline]);

  const fetchAllocations = useCallback(async () => {
    if (!isOnline) {
      console.log('Skipping allocation fetch - offline mode');
      return;
    }

    try {
      const allocationsRef = collection(db, 'allocations');
      const q = query(allocationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allocationsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        allocationId: doc.id
      })) as Allocation[];

      // Enrich with room and section names
      const enrichedAllocations = allocationsData.map(allocation => ({
        ...allocation,
        roomName: rooms.find(r => r.roomId === allocation.roomId)?.roomName || 'Unknown Room',
        sectionName: sections.find(s => s.sectionId === allocation.sectionId)?.sectionName || 'Unknown Section'
      }));

      setAllocations(enrichedAllocations);

      // Cache allocations locally
      localStorage.setItem('cachedAllocations', JSON.stringify(allocationsData));
    } catch (error: any) {
      console.error('Error fetching allocations:', error);

      // Try to load from cache if available
      const cachedAllocations = localStorage.getItem('cachedAllocations');
      if (cachedAllocations) {
        try {
          const allocationsData = JSON.parse(cachedAllocations);
          // Enrich with room and section names from current state
          const enrichedAllocations = allocationsData.map((allocation: any) => ({
            ...allocation,
            roomName: rooms.find(r => r.roomId === allocation.roomId)?.roomName || 'Unknown Room',
            sectionName: sections.find(s => s.sectionId === allocation.sectionId)?.sectionName || 'Unknown Section'
          }));
          setAllocations(enrichedAllocations);
          console.log('Loaded allocations from cache');
        } catch (parseError) {
          console.error('Error parsing cached allocations:', parseError);
        }
      }
    }
  }, [isOnline, rooms, sections]);

  // Form handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createRoomFunction = httpsCallable(functions, 'createRoom');
      const result = await createRoomFunction({
        roomName: newRoom.roomName,
        capacity: parseInt(newRoom.capacity),
        roomType: newRoom.roomType
      });

      if (result.data.success) {
        setNewRoom({ roomName: "", capacity: "", roomType: "classroom" });
        fetchRooms();
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
      const result = await createSectionFunction({
        department: newSection.department,
        sectionName: newSection.sectionName,
        classStrength: parseInt(newSection.classStrength),
        requiredRoomType: newSection.requiredRoomType
      });

      if (result.data.success) {
        setNewSection({ department: "", sectionName: "", classStrength: "", requiredRoomType: "classroom" });
        fetchSections();
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
      const result = await suggestRoomsFunction({
        sectionStrength: section.classStrength,
        duration: 60, // Default 1 hour
        roomType: section.requiredRoomType || 'classroom'
      });

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
      const result = await allocateRoomFunction({
        roomId,
        sectionId: allocationForm.sectionId,
        date: allocationForm.date,
        startTime: allocationForm.startTime,
        endTime: allocationForm.endTime
      });

      if (result.data.success) {
        setAllocationForm({ sectionId: "", date: "", startTime: "", endTime: "" });
        setSuggestedRooms([]);
        fetchAllocations();
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
              <span className="text-sm text-muted-foreground">
                Faculty Portal
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
            <span className="text-sm text-muted-foreground">
              Faculty Portal
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={dataLoading || !isOnline}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
          </div>
        </div>
            <p className="text-muted-foreground">
              AI-Powered Room Management & Allocation System
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rooms">Room Management</TabsTrigger>
              <TabsTrigger value="sections">Section Management</TabsTrigger>
              <TabsTrigger value="allocation">Room Allocation</TabsTrigger>
              <TabsTrigger value="dashboard">Allocation Dashboard</TabsTrigger>
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
                          onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
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
                          onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                          required
                          min="1"
                        />
              </div>

                      <div className="space-y-2">
                        <Label htmlFor="roomType">Room Type</Label>
                        <Select value={newRoom.roomType} onValueChange={(value: any) => setNewRoom({...newRoom, roomType: value})}>
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
                          onChange={(e) => setNewSection({...newSection, department: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sectionName">Section Name</Label>
                        <Input
                          id="sectionName"
                          placeholder="e.g., CS-A"
                          value={newSection.sectionName}
                          onChange={(e) => setNewSection({...newSection, sectionName: e.target.value})}
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
                          onChange={(e) => setNewSection({...newSection, classStrength: e.target.value})}
                          required
                          min="1"
                        />
            </div>

                      <div className="space-y-2">
                        <Label htmlFor="requiredRoomType">Required Room Type</Label>
                        <Select value={newSection.requiredRoomType} onValueChange={(value: any) => setNewSection({...newSection, requiredRoomType: value})}>
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
                      <Select value={allocationForm.sectionId} onValueChange={(value) => setAllocationForm({...allocationForm, sectionId: value})}>
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
                        onChange={(e) => setAllocationForm({...allocationForm, date: e.target.value})}
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
                          onChange={(e) => setAllocationForm({...allocationForm, startTime: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={allocationForm.endTime}
                          onChange={(e) => setAllocationForm({...allocationForm, endTime: e.target.value})}
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Room Allocation Dashboard
                  </CardTitle>
                  <CardDescription>
                    View all current room allocations
                  </CardDescription>
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
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
              </Button>
                          </div>
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