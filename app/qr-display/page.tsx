"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, QrCode, Shield, Eye, EyeOff } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";

export default function QRDisplayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [qrPayload, setQrPayload] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const qrRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);

  const eventTitle = searchParams.get('eventTitle') || 'Event';
  const eventVenue = searchParams.get('eventVenue') || 'Venue';

  useEffect(() => {
    // Get QR data from URL parameters
    const payload = searchParams.get('payload');
    const expiresAt = searchParams.get('expiresAt');

    if (!payload) {
      router.push('/events');
      return;
    }

    setQrPayload(payload);

    // Calculate initial time left
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt);
      const currentTime = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
      setTimeLeft(remaining);
      setIsExpired(remaining <= 0);
    }

    // Generate QR code URL
    generateQRCode(payload);

    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsExpired(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Security: Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Security: Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        visibilityRef.current = false;
        setShowQR(false);
      } else {
        setIsVisible(true);
        visibilityRef.current = true;
      }
    };

    // Security: Handle window blur (tab change)
    const handleWindowBlur = () => {
      setShowQR(false);
    };

    // Security: Handle window focus
    const handleWindowFocus = () => {
      if (visibilityRef.current) {
        setShowQR(true);
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [searchParams, router]);

  const generateQRCode = async (payload: string) => {
    try {
      // Use QR Code API (you can replace with your preferred QR code service)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshQR = () => {
    router.back(); // Go back to event details to generate new QR
  };

  const handleBackToEvents = () => {
    router.push('/events');
  };

  if (isExpired) {
    return (
      <AuthGuard allowedRoles={['student', 'faculty']} requireAuth={true} requireRole={true}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-red-600">QR Code Expired</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                This QR code has expired and is no longer valid for attendance marking.
              </p>
              <div className="space-y-2">
                <Button onClick={handleRefreshQR} className="w-full">
                  Generate New QR Code
                </Button>
                <Button variant="outline" onClick={handleBackToEvents} className="w-full">
                  Back to Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student', 'faculty']} requireAuth={true} requireRole={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="w-6 h-6" />
                Attendance QR Code
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="font-medium">{eventTitle}</div>
                <div>{eventVenue}</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security:</strong> This QR code is unique and single-use.
                  Do not share or screenshot this code.
                </AlertDescription>
              </Alert>

              {/* Timer */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Time remaining before expiration
                </p>
              </div>

              {/* QR Code Display */}
              <div className="text-center">
                {showQR && qrCodeUrl ? (
                  <div
                    ref={qrRef}
                    className="inline-block p-4 bg-white rounded-lg shadow-inner"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <img
                      src={qrCodeUrl}
                      alt="Attendance QR Code"
                      className="w-64 h-64"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      {isVisible ? (
                        <>
                          <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">QR Code Hidden</p>
                          <p className="text-xs text-gray-400 mt-1">Focus window to show</p>
                        </>
                      ) : (
                        <>
                          <Shield className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                          <p className="text-sm text-orange-600">Tab Changed</p>
                          <p className="text-xs text-orange-500 mt-1">QR hidden for security</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Show this QR code to the scanner</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The scanner will validate and mark your attendance
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleRefreshQR}
                  variant="outline"
                  className="w-full"
                >
                  Generate New QR Code
                </Button>
                <Button
                  onClick={handleBackToEvents}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Events
                </Button>
              </div>

              {/* Security Warnings */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• Right-clicking is disabled for security</p>
                <p>• QR code hides when tab changes</p>
                <p>• Screenshot this code to invalidate it</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
