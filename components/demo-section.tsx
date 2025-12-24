"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
// Removed AttendAI demo - replaced with Events system
import { RoomSyncDemo } from "@/components/roomsync/roomsync-demo";
import { IssueHubDemo } from "@/components/issuehub/issuehub-demo";

type TabType = "events" | "roomsync" | "issuehub";

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [isInteracting, setIsInteracting] = useState(false);

  const tabs = [
    { id: "events" as TabType, label: "Events" },
    { id: "roomsync" as TabType, label: "RoomSync" },
    { id: "issuehub" as TabType, label: "IssueHub" },
  ];

  return (
    <>
      {/* Blur Overlay */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-background/30 backdrop-blur-md z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <section className="w-full py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              See How the Platform Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Interactive simulation of AttendAI, RoomSync, and IssueHub
            </p>
          </div>

          {/* Demo Card */}
          <Card className="rounded-lg shadow-lg overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === "events" && (
                  <motion.div
                    key="events"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold">Events & Attendance System</h3>
                      <p className="text-muted-foreground">
                        Experience smart attendance tracking with QR code generation,
                        validation, and automated monitoring.
                      </p>

                      <div className="grid md:grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                            📅
                          </div>
                          <h4 className="font-semibold mb-2">Today's Events</h4>
                          <p className="text-sm text-muted-foreground">
                            View and select from today's scheduled events
                          </p>
                        </div>

                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                            📱
                          </div>
                          <h4 className="font-semibold mb-2">QR Generation</h4>
                          <p className="text-sm text-muted-foreground">
                            Generate secure, time-limited QR codes for attendance
                          </p>
                        </div>

                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                            📊
                          </div>
                          <h4 className="font-semibold mb-2">Real-time Tracking</h4>
                          <p className="text-sm text-muted-foreground">
                            Automated attendance validation and email notifications
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "roomsync" && (
                  <motion.div
                    key="roomsync"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <RoomSyncDemo onInteractionChange={setIsInteracting} />
                  </motion.div>
                )}

                {activeTab === "issuehub" && (
                  <motion.div
                    key="issuehub"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <IssueHubDemo onInteractionChange={setIsInteracting} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
