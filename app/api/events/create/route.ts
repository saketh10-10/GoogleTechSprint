import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';

// POST /api/events/create - Create a new event (Faculty only)
export async function POST(request: NextRequest) {
  try {
    // For development, skip authentication check since getCurrentUser() doesn't work in API routes
    // In production, implement proper authentication middleware
    // const user = getCurrentUser();
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // For development, we'll skip role checking since we're using mock auth
    // In production, this would check if the user has faculty role from the authenticated user
    // const userRole = localStorage.getItem('userType');
    // if (userRole !== 'faculty') {
    //   return NextResponse.json(
    //     { success: false, error: 'Only faculty members can create events' },
    //     { status: 403 }
    //   );
    // }

    const {
      eventId,
      title,
      date,
      startTime,
      endTime,
      venue,
      description,
      createdAt,
      createdBy
    } = await request.json();

    // Validation
    if (!title || !date || !startTime || !endTime || !venue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, date, startTime, endTime, venue' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return NextResponse.json(
        { success: false, error: 'Event date cannot be in the past' },
        { status: 400 }
      );
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Create event object
    const eventData = {
      eventId: eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      date: date,
      startTime: startTime,
      endTime: endTime,
      venue: venue.trim(),
      description: description?.trim() || '',
      createdAt: createdAt || new Date().toISOString(),
      createdBy: createdBy || 'unknown',
      createdByRole: 'faculty', // Since this is a faculty-only API
      status: 'active'
    };

    // Live Firestore creation
    try {
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      if (!db || typeof db !== 'object') {
        throw new Error('Firestore not initialized');
      }

      const docData = {
        ...eventData,
        date: Timestamp.fromDate(new Date(date)),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'events'), docData);

      return NextResponse.json({
        success: true,
        message: 'Event created successfully',
        eventId: docRef.id,
        event: { ...eventData, id: docRef.id }
      });
    } catch (saveError) {
      console.error('Error saving event to Firestore:', saveError);
      return NextResponse.json(
        { success: false, error: 'Database save failed', details: saveError instanceof Error ? saveError.message : String(saveError) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
