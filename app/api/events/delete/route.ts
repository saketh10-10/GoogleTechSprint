import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

// POST /api/events/delete - Delete an existing event (Faculty only)
export async function POST(request: NextRequest) {
    try {
        const { eventId } = await request.json();

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'Event ID is required' },
                { status: 400 }
            );
        }

        try {
            const eventRef = doc(db, 'events', eventId);
            await deleteDoc(eventRef);

            console.log('Event deleted successfully:', eventId);

            return NextResponse.json({
                success: true,
                message: 'Event deleted successfully'
            });
        } catch (dbError) {
            console.error('Firestore Delete Error:', dbError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete event from database' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
