import { NextRequest, NextResponse } from 'next/server';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

// GET /api/events - Fetch today's events
export async function GET(request: NextRequest) {
  try {
    // For now, return mock data plus sample faculty-created events
    // In production, this would query Firestore for all events
    let mockEvents = [
      {
        eventId: 'event-001',
        title: 'Data Structures Lecture',
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '09:00',
        endTime: '10:30',
        venue: 'Room 101, Block A',
        description: 'Introduction to data structures and algorithms'
      },
      {
        eventId: 'event-002',
        title: 'Database Systems Lab',
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '11:00',
        endTime: '12:30',
        venue: 'Computer Lab 2',
        description: 'Hands-on database design and SQL queries'
      },
      {
        eventId: 'event-003',
        title: 'Web Development Workshop',
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Seminar Hall B',
        description: 'Modern web development techniques and frameworks'
      },
      // Sample faculty-created events (would be loaded from database in production)
      {
        eventId: 'faculty-event-001',
        title: 'Advanced Algorithms Seminar',
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '15:00',
        endTime: '16:30',
        venue: 'Conference Room 201',
        description: 'Advanced topics in algorithm design and analysis - Created by Faculty'
      },
      {
        eventId: 'faculty-event-002',
        title: 'Machine Learning Workshop',
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '10:00',
        endTime: '12:00',
        venue: 'AI Lab 305',
        description: 'Hands-on machine learning workshop with practical examples - Created by Faculty'
      }
    ];

    // In production, uncomment this code to call the actual Cloud Function:
    /*
    try {
      const functions = getFunctions(app);
      const getTodaysEvents = httpsCallable(functions, 'getTodaysEvents');
      const result = await getTodaysEvents();
      return NextResponse.json(result.data);
    } catch (error) {
      console.error('Cloud Function error:', error);
      // Fall back to mock data if Cloud Function fails
    }
    */

    return NextResponse.json({
      success: true,
      events: mockEvents,
      totalEvents: mockEvents.length,
      date: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
