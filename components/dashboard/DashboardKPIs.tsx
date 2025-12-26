"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle2, Building2, MessageSquare } from "lucide-react";
import { DataService } from "@/lib/data-service";

interface KPIData {
  todaysEvents: number;
  attendanceMarked: number;
  roomsAllocated: number;
  openIssues: number;
}

export function DashboardKPIs() {
  const [kpiData, setKpiData] = useState<KPIData>({
    todaysEvents: 0,
    attendanceMarked: 0,
    roomsAllocated: 0,
    openIssues: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      // Use optimized data service with caching and batched queries
      const metrics = await DataService.getDashboardMetrics();
      setKpiData({
        todaysEvents: metrics.todaysEvents,
        attendanceMarked: metrics.attendanceMarked,
        roomsAllocated: metrics.roomsAllocated,
        openIssues: metrics.openIssues,
      });
    } catch (error) {
      console.error("Error fetching KPI data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = [
    {
      label: "Today's Events",
      value: kpiData.todaysEvents,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Attendance Marked",
      value: `${kpiData.attendanceMarked}%`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Rooms Allocated",
      value: kpiData.roomsAllocated,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Open Issues",
      value: kpiData.openIssues,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-secondary rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className="border-border hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-lg ${kpi.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-sm text-muted-foreground font-medium">
                  {kpi.label}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
