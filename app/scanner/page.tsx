"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, QrCode, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";

export default function QRScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  };

  const scanQRCode = async () => {
    if (!isScanning) return;

    try {
      // For demo purposes, we'll simulate QR scanning
      // In a real implementation, you would use a QR code scanning library
      // like jsQR or a service worker to process the video stream

      // Mock QR scan result - in real app, this would come from camera processing
      const mockQRData = "qr_abc123:nonce_xyz789";

      setScanResult(mockQRData);
      await validateQRCode(mockQRData);

    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError('Failed to scan QR code. Please try again.');
    }
  };

  const validateQRCode = async (qrData: string) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Parse QR data (format: "qrId:nonce")
      const [qrId, nonce] = qrData.split(':');

      if (!qrId || !nonce) {
        throw new Error('Invalid QR code format');
      }

      // For demo, use a mock event ID
      const eventId = "event-001";

      // Call validation API
      const response = await fetch('/api/validate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrId,
          eventId,
          nonce,
          timestamp: Date.now()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationResult({ success: true, ...result });
        // Auto-clear after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setValidationResult(null);
        }, 3000);
      } else {
        setValidationResult({ success: false, error: result.error });
        // Auto-clear error after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setValidationResult(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setValidationResult({
        success: false,
        error: err.message || 'Validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setValidationResult(null);
    setError(null);
  };

  return (
    <AuthGuard allowedRoles={['faculty', 'admin']} requireAuth={true} requireRole={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">QR Scanner</h1>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Attendance Scanner
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Camera View */}
              <div className="relative">
                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                  {isScanning ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-2 border-white rounded-lg opacity-50"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Scan Result */}
              {scanResult && (
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    <strong>QR Detected:</strong> {scanResult}
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Result */}
              {validationResult && (
                <Alert variant={validationResult.success ? "default" : "destructive"}>
                  {validationResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {validationResult.success ? (
                      <div>
                        <strong>✅ Attendance Marked!</strong>
                        <div className="text-sm mt-1">
                          Event: {validationResult.eventTitle}<br/>
                          ID: {validationResult.attendanceId}
                        </div>
                      </div>
                    ) : (
                      <strong>❌ Validation Failed: {validationResult.error}</strong>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Controls */}
              <div className="space-y-2">
                {!isScanning ? (
                  <Button onClick={startCamera} className="w-full" disabled={isValidating}>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={scanQRCode} className="w-full" disabled={isValidating}>
                      {isValidating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Scan QR Code
                        </>
                      )}
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="w-full">
                      Stop Camera
                    </Button>
                  </>
                )}

                {(scanResult || validationResult || error) && (
                  <Button onClick={resetScanner} variant="ghost" className="w-full">
                    Reset Scanner
                  </Button>
                )}
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Position QR code within the frame</p>
                <p>• Ensure good lighting</p>
                <p>• Hold steady while scanning</p>
                <p>• Each QR is single-use</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
