"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Home,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.date) {
      newErrors.date = "Event date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "Event date cannot be in the past";
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (
      formData.startTime &&
      formData.endTime &&
      formData.startTime >= formData.endTime
    ) {
      newErrors.endTime = "End time must be after start time";
    }

    if (!formData.venue.trim()) {
      newErrors.venue = "Venue is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate unique event ID
      const eventId = `event_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const eventData = {
        eventId,
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: "faculty", // In production, get from authenticated user
      };

      // Call API to create event
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/events");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to create event");
      }
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthGuard
        allowedRoles={["faculty"]}
        requireAuth={true}
        requireRole={true}
      >
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-green-600">
                Event Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your event "{formData.title}" has been created and is now
                available for attendance tracking.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to events page...
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["faculty"]} requireAuth={true} requireRole={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Event
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Create an event for attendance tracking. Only faculty members can
              create events.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Create Event Form */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Fill in all the required information for the event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Data Structures Lecture"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={errors.date ? "border-red-500" : ""}
                      disabled={isLoading}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.date}
                      </p>
                    )}
                  </div>

                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="startTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Start Time *
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      className={errors.startTime ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="endTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      End Time *
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      className={errors.endTime ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Venue */}
                <div className="space-y-2">
                  <Label htmlFor="venue" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Venue *
                  </Label>
                  <Input
                    id="venue"
                    type="text"
                    placeholder="e.g., Room 101, Block A"
                    value={formData.venue}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    className={errors.venue ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.venue && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.venue}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Optional event description..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    disabled={isLoading}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Provide additional details about the event (optional)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Event..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Event Creation Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Events can only be created for future dates</li>
                <li>• All fields marked with * are required</li>
                <li>• End time must be after start time</li>
                <li>
                  • Once created, events will appear in the Events list for
                  attendance tracking
                </li>
                <li>
                  • Students can generate QR codes for attendance marking on
                  event day
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
