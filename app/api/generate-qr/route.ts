import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth-service';

// POST /api/generate-qr - Generate QR code for attendance
export async function POST(request: NextRequest) {
  try {
    // For development, skip strict authentication check since getCurrentUser() doesn't work on server
    // In production, proper authentication middleware should be used
    // const user = getCurrentUser();
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // For development/demo purposes, generate mock QR data
    // In production, this would call the Cloud Function
    const crypto = require('crypto');
    const qrId = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const qrPayload = `${qrId}:${nonce}`;
    const expiresAt = Date.now() + (2 * 60 * 1000); // 2 minutes from now

    // Mock event data (in production, this would be validated)
    const mockEventData = {
      title: 'Mock Event',
      venue: 'Mock Venue'
    };

    // In production, uncomment this code to call the actual Cloud Function:
    /*
    try {
      const functions = getFunctions(app);
      const generateAttendanceQR = httpsCallable(functions, 'generateAttendanceQR');
      const result = await generateAttendanceQR({ eventId });
      return NextResponse.json(result.data);
    } catch (error) {
      console.error('Cloud Function error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }
    */

    return NextResponse.json({
      success: true,
      qrPayload: qrPayload,
      qrId: qrId,
      expiresAt: expiresAt,
      expiresInSeconds: 2 * 60, // 2 minutes
      eventTitle: mockEventData.title,
      eventVenue: mockEventData.venue
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR code',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
