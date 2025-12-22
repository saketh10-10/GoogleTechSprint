"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AttendAIDemo } from "@/components/attendai/attendai-demo";
import { RoomSyncDemo } from "@/components/roomsync/roomsync-demo";
import { IssueHubDemo } from "@/components/issuehub/issuehub-demo";

type TabType = "attendai" | "roomsync" | "issuehub";

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<TabType>("attendai");
  const [isInteracting, setIsInteracting] = useState(false);

  const tabs = [
    { id: "attendai" as TabType, label: "AttendAI" },
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
                {activeTab === "attendai" && (
                  <motion.div
                    key="attendai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <AttendAIDemo onInteractionChange={setIsInteracting} />
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
