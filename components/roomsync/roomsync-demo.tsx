"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Sparkles, CheckCircle } from "lucide-react";

type RoomStatus = "available" | "allocated" | "suggested";

interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  capacity: number;
}

interface RoomSyncDemoProps {
  onInteractionChange?: (isActive: boolean) => void;
}

export function RoomSyncDemo({ onInteractionChange }: RoomSyncDemoProps) {
  const [showAllocation, setShowAllocation] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    onInteractionChange?.(showAllocation);
  }, [showAllocation, onInteractionChange]);

  const rooms: Room[] = [
    { id: "1", name: "Room 101", status: "available", capacity: 30 },
    { id: "2", name: "Seminar Hall", status: "allocated", capacity: 150 },
    { id: "3", name: "Activity Room", status: "suggested", capacity: 50 },
  ];

  const handleAllocate = () => {
    setShowAllocation(true);
    setSelectedRoom("2"); // Seminar Hall
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "allocated":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "suggested":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return <CheckCircle className="w-3 h-3" />;
      case "allocated":
        return <Building2 className="w-3 h-3" />;
      case "suggested":
        return <Sparkles className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">RoomSync Demo</h3>
      <p className="text-muted-foreground">
        Discover intelligent room allocation and real-time availability
        tracking.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Rooms List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Available Rooms</h4>
            <Button
              onClick={handleAllocate}
              disabled={showAllocation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {showAllocation ? "Allocated" : "Allocate Room"}
            </Button>
          </div>

          <div className="space-y-3">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={false}
                animate={{
                  scale: showAllocation && selectedRoom === room.id ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card
                  className={`p-4 transition-all duration-300 ${
                    showAllocation && selectedRoom === room.id
                      ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <h5 className="font-semibold">{room.name}</h5>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="w-3 h-3" />
                        <span>Capacity: {room.capacity}</span>
                      </div>
                      <Badge
                        className={`${getStatusColor(room.status)} border`}
                      >
                        {getStatusIcon(room.status)}
                        <span className="ml-1 capitalize">{room.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAllocation && selectedRoom === room.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="mt-3 pt-3 border-t border-border overflow-hidden"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            Best capacity match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          AI-suggested based on event requirements
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Allocation Details */}
        <Card
          className={`p-6 ${
            showAllocation
              ? "border-blue-500 dark:border-blue-400"
              : "border-dashed opacity-50"
          } transition-all duration-300`}
        >
          <AnimatePresence mode="wait">
            {showAllocation ? (
              <motion.div
                key="allocation-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="text-lg font-semibold">
                    Allocation Confirmed
                  </h4>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Room</span>
                    <span className="text-sm font-medium">Seminar Hall</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Capacity
                    </span>
                    <span className="text-sm font-medium">150 people</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 border">
                      Allocated
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      AI Confidence
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      95%
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 This allocation was optimized based on event size,
                    equipment needs, and room availability.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAllocation(false);
                    setSelectedRoom(null);
                  }}
                  className="w-full mt-4"
                >
                  Reset Demo
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="allocation-inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-3"
              >
                <Building2 className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Click "Allocate Room" to see AI-powered room allocation
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
