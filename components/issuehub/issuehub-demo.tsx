"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  User,
  Clock,
} from "lucide-react";

interface IssueHubDemoProps {
  onInteractionChange?: (isActive: boolean) => void;
}

export function IssueHubDemo({ onInteractionChange }: IssueHubDemoProps) {
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    onInteractionChange?.(showSolution);
  }, [showSolution, onInteractionChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">IssueHub Demo</h3>
      <p className="text-muted-foreground">
        Explore collaborative problem-solving with upvoting and issue
        management.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Issue Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-2">
                  Projector not working in Block B
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>Posted by Anonymous Student</span>
                </div>
              </div>
              <AnimatePresence>
                {showSolution && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              The projector in Room 204, Block B has been malfunctioning since
              yesterday. Multiple classes have been affected. Urgent attention
              needed.
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Posted 2 hours ago</span>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">24 Upvotes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">8 Replies</span>
              </div>
            </div>

            <Button
              onClick={() => setShowSolution(true)}
              disabled={showSolution}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              {showSolution ? "Solution Displayed" : "View Solution"}
            </Button>
          </div>
        </Card>

        {/* Solution Panel */}
        <Card
          className={`p-6 ${
            showSolution
              ? "border-green-500 dark:border-green-400"
              : "border-dashed opacity-50"
          } transition-all duration-300`}
        >
          <AnimatePresence mode="wait">
            {showSolution ? (
              <motion.div
                key="solution-active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="text-lg font-semibold">Solution Found</h4>
                </div>

                <div className="pt-2 space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          Facilities Manager
                        </span>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 border text-xs">
                          Official
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        1 hour ago
                      </p>
                      <p className="text-sm leading-relaxed">
                        Thank you for reporting this issue. Our technical team
                        has inspected the projector and replaced the faulty HDMI
                        cable. The projector is now fully operational.
                      </p>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2 pt-2">
                    <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      18 people found this helpful
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Issue resolved and verified by the community
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSolution(false)}
                  className="w-full mt-4"
                >
                  Close Solution
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="solution-inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-3"
              >
                <MessageSquare className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Click "View Solution" to see the community response
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
