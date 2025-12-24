import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';

// POST /api/validate-qr - Validate QR code and mark attendance
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { qrId, eventId, nonce, timestamp } = await request.json();

    if (!qrId || !eventId || !nonce || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'QR code payload is incomplete' },
        { status: 400 }
      );
    }

    // For development/demo purposes, simulate QR validation
    // In production, this would call the Cloud Function
    console.log('Validating QR:', { qrId, eventId, nonce, timestamp });

    // Mock validation logic
    const isValid = qrId && eventId && nonce && timestamp;

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code format'
      }, { status: 400 });
    }

    // Mock successful validation
    const mockAttendanceData = {
      attendanceId: `att_${Date.now()}`,
      userId: 'mock-user-id',
      eventId: eventId,
      eventTitle: 'Mock Event',
      eventVenue: 'Mock Venue',
      scanTime: new Date().toISOString(),
      scannedBy: user.uid || 'scanner-user',
      timestamp: new Date().toISOString()
    };

    // In production, uncomment this code to call the actual Cloud Function:
    /*
    try {
      const functions = getFunctions(app);
      const validateAttendanceQR = httpsCallable(functions, 'validateAttendanceQR');
      const result = await validateAttendanceQR({ qrId, eventId, nonce, timestamp });
      return NextResponse.json(result.data);
    } catch (error) {
      console.error('Cloud Function error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to validate QR code' },
        { status: 500 }
      );
    }
    */

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully.",
      attendanceId: mockAttendanceData.attendanceId,
      eventTitle: mockAttendanceData.eventTitle,
      timestamp: mockAttendanceData.timestamp,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate QR code',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
