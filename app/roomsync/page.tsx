"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Search, Sparkles, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { RoomAllocationDialog } from "@/components/roomsync/room-allocation-dialog"
import { Badge } from "@/components/ui/badge"

// Mock rooms data
const rooms = [
  {
    id: "101",
    name: "Room 101",
    building: "Main Block",
    capacity: 60,
    status: "available" as const,
    facilities: ["Projector", "AC", "Whiteboard"],
    currentAllocation: null,
  },
  {
    id: "102",
    name: "Room 102",
    building: "Main Block",
    capacity: 50,
    status: "occupied" as const,
    facilities: ["Projector", "AC"],
    currentAllocation: {
      section: "CS-A",
      subject: "Data Structures",
      time: "09:00 AM - 11:00 AM",
    },
  },
  {
    id: "201",
    name: "Lab 201",
    building: "CS Building",
    capacity: 40,
    status: "available" as const,
    facilities: ["Computers", "Projector", "AC", "Whiteboard"],
    currentAllocation: null,
  },
  {
    id: "202",
    name: "Lab 202",
    building: "CS Building",
    capacity: 40,
    status: "available" as const,
    facilities: ["Computers", "Projector", "AC"],
    currentAllocation: null,
  },
  {
    id: "301",
    name: "Auditorium A",
    building: "Auditorium Block",
    capacity: 200,
    status: "occupied" as const,
    facilities: ["Projector", "AC", "Audio System", "Stage"],
    currentAllocation: {
      section: "All Sections",
      subject: "Guest Lecture",
      time: "02:00 PM - 04:00 PM",
    },
  },
  {
    id: "302",
    name: "Seminar Hall",
    building: "Auditorium Block",
    capacity: 100,
    status: "available" as const,
    facilities: ["Projector", "AC", "Audio System"],
    currentAllocation: null,
  },
]

const aiSuggestions = [
  {
    room: "Room 101",
    section: "CS-B",
    reason: "Optimal capacity match and proximity to CS labs",
    confidence: 95,
  },
  {
    room: "Lab 201",
    section: "IT-A",
    reason: "Available computers match lab requirements",
    confidence: 88,
  },
  {
    room: "Seminar Hall",
    section: "All Sections",
    reason: "Large capacity suitable for combined classes",
    confidence: 82,
  },
]

export default function RoomSyncPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.building.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAllocateRoom = (roomId: string) => {
    setSelectedRoom(roomId)
    setShowDialog(true)
  }

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom)

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-secondary backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-secondary" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-white">RoomSync</h1>
              <p className="text-xs text-muted-foreground">Intelligent Room Allocation System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-accent text-accent">
              Admin Access
            </Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header & Search */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-accent" />
            <h2 className="text-3xl font-medium text-white">Room Management</h2>
          </div>
          <p className="text-muted-foreground mb-6">View all rooms and allocate them to sections with AI assistance</p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms or buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-secondary text-white placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* AI Suggestions */}
        <Card className="p-6 bg-card border-accent/30 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-medium text-white">AI Suggestions</h3>
            <Badge className="ml-auto bg-accent/10 text-accent border-accent/20">Powered by AI</Badge>
          </div>

          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{suggestion.room}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm text-accent">{suggestion.section}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p className="text-sm font-medium text-accent">{suggestion.confidence}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-card border-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{rooms.length}</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-medium text-white">
                  {rooms.filter((r) => r.status === "available").length}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{rooms.filter((r) => r.status === "occupied").length}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={`p-6 bg-card transition-all duration-200 ${
                room.status === "available"
                  ? "border-secondary hover:border-primary/50"
                  : "border-orange-500/30 hover:border-orange-500/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">{room.building}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    room.status === "available"
                      ? "border-green-500/30 text-green-500 bg-green-500/10"
                      : "border-orange-500/30 text-orange-500 bg-orange-500/10"
                  }
                >
                  {room.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="text-white font-medium">{room.capacity} students</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {room.facilities.map((facility, index) => (
                    <span key={index} className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">
                      {facility}
                    </span>
                  ))}
                </div>

                {room.currentAllocation && (
                  <div className="mt-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{room.currentAllocation.time}</span>
                    </div>
                    <p className="text-sm text-white font-medium">{room.currentAllocation.section}</p>
                    <p className="text-xs text-muted-foreground">{room.currentAllocation.subject}</p>
                  </div>
                )}
              </div>

              <Button
                className={`w-full ${
                  room.status === "available"
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "bg-secondary hover:bg-secondary/90 text-muted-foreground"
                }`}
                onClick={() => handleAllocateRoom(room.id)}
                disabled={room.status === "occupied"}
              >
                {room.status === "available" ? "Allocate Room" : "View Details"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Allocation Dialog */}
      {selectedRoomData && (
        <RoomAllocationDialog
          room={selectedRoomData}
          open={showDialog}
          onOpenChange={setShowDialog}
          onAllocate={() => {
            setShowDialog(false)
            // In production, update room allocation here
          }}
        />
      )}
    </div>
  )
}
