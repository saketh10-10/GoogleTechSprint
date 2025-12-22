"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, QrCode, CheckCircle } from "lucide-react";

interface AttendAIDemoProps {
  onInteractionChange?: (isActive: boolean) => void;
}

export function AttendAIDemo({ onInteractionChange }: AttendAIDemoProps) {
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    onInteractionChange?.(showQR);
  }, [showQR, onInteractionChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">AttendAI Demo</h3>
      <p className="text-muted-foreground">
        Experience smart attendance tracking with QR code generation and
        automated monitoring.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Event Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  Data Structures Lab
                </h4>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Faculty Approved
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Today, 2:00 PM - 5:00 PM</span>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                CSE Department • Room 301 • Dr. Sarah Johnson
              </p>

              <Button
                onClick={() => setShowQR(true)}
                disabled={showQR}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQR ? "QR Code Active" : "Mark Attendance"}
              </Button>
            </div>
          </div>
        </Card>

        {/* QR Code Panel */}
        <Card
          className={`p-6 ${
            showQR
              ? "border-blue-500 dark:border-blue-400"
              : "border-dashed opacity-50"
          } transition-all duration-300`}
        >
          <AnimatePresence mode="wait">
            {showQR ? (
              <motion.div
                key="qr-active"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col items-center justify-center h-full space-y-4"
              >
                <div className="text-center mb-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Scan QR Code to Mark Attendance
                  </p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    Expires in 20s
                  </p>
                </div>

                {/* QR Code Placeholder */}
                <motion.div
                  initial={{ rotate: -5, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  className="w-48 h-48 bg-white dark:bg-gray-900 border-4 border-blue-600 dark:border-blue-400 rounded-lg flex items-center justify-center p-4"
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-blue-600 dark:text-blue-400" />
                  </div>
                </motion.div>

                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground max-w-xs">
                    ⚠️ Attendance will be reported to faculty
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Do not share or screenshot this QR code
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQR(false)}
                  className="mt-4"
                >
                  Close QR Code
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="qr-inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-3"
              >
                <QrCode className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Click "Mark Attendance" to generate QR code
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
