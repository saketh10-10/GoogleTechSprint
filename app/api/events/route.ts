import { NextRequest, NextResponse } from 'next/server';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

// GET /api/events - Fetch today's events
export async function GET(request: NextRequest) {
  try {
    // For now, return mock data plus sample faculty-created events
    // In production, this would query Firestore for all events
    // Live Firestore fetch
    try {
      const { collection, getDocs, query, orderBy, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('date', 'asc'), orderBy('startTime', 'asc'));
      const querySnapshot = await getDocs(q);

      const liveEvents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateString = '';
        if (data.date instanceof Timestamp) {
          dateString = data.date.toDate().toISOString().split('T')[0];
        } else if (data.date && typeof data.date === 'string') {
          dateString = data.date;
        }

        return {
          ...data,
          eventId: doc.id,
          date: dateString
        };
      });

      if (liveEvents.length > 0) {
        return NextResponse.json({
          success: true,
          events: liveEvents,
          totalEvents: liveEvents.length,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (fetchError) {
      console.error('Error fetching events from Firestore:', fetchError);
    }

    // Fallback Mock Data
    const mockEvents = [
      {
        eventId: 'event-001',
        title: 'Data Structures Lecture',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:30',
        venue: 'Room 101, Block A',
        description: 'Introduction to data structures and algorithms'
      },
      {
        eventId: 'event-002',
        title: 'Database Systems Lab',
        date: new Date().toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '12:30',
        venue: 'Computer Lab 2',
        description: 'Hands-on database design and SQL queries'
      }
    ];

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
