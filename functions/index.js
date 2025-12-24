const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Initialize SendGrid
// Get API key from environment config
sgMail.setApiKey(
  functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY || ""
);

// ============================================
// CONSTANTS
// ============================================
const QR_EXPIRY_MINUTES = 2;
const QR_EXPIRY_MS = QR_EXPIRY_MINUTES * 60 * 1000;
const AUTHORITY_EMAIL =
  functions.config().email?.authority ||
  process.env.AUTHORITY_EMAIL ||
  "authority@klh.edu.in";

// ============================================
// CLOUD FUNCTION: GET TODAY'S EVENTS
// ============================================
exports.getTodaysEvents = functions.https.onCall(async (data, context) => {
  try {
    // Optional authentication - allow unauthenticated reads for events
    // if (context.auth) { ... } // Uncomment if authentication is required

    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Query events for today
    const eventsQuery = await db
      .collection("events")
      .where("date", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("date", "<", admin.firestore.Timestamp.fromDate(endOfDay))
      .orderBy("date")
      .orderBy("startTime")
      .get();

    const events = [];
    eventsQuery.forEach((doc) => {
      const eventData = doc.data();
      events.push({
        eventId: doc.id,
        title: eventData.title,
        date: eventData.date.toDate().toISOString().split('T')[0], // YYYY-MM-DD format
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        venue: eventData.venue,
        description: eventData.description || "",
        // Add any other fields as needed
      });
    });

    return {
      success: true,
      events: events,
      totalEvents: events.length,
      date: today.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error("Get Today's Events Error:", error);

    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch today's events.",
      error.message
    );
  }
});

// ============================================
// CLOUD FUNCTION: GENERATE ATTENDANCE QR
// ============================================
exports.generateAttendanceQR = functions.https.onCall(async (data, context) => {
  try {
    // SECURITY CHECK: Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to generate QR codes."
      );
    }

    const userId = context.auth.uid;
    const { eventId } = data;

    // VALIDATION: Check required fields
    if (!eventId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Event ID is required."
      );
    }

    // VALIDATION: Check if event exists and is today
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Event not found. Cannot generate QR for non-existent event."
      );
    }

    const event = eventDoc.data();
    const eventDate = event.date.toDate();
    const today = new Date();

    // Check if event is today
    if (
      eventDate.getFullYear() !== today.getFullYear() ||
      eventDate.getMonth() !== today.getMonth() ||
      eventDate.getDate() !== today.getDate()
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Event is not scheduled for today. Cannot generate QR."
      );
    }

    // VALIDATION: Check if attendance already exists (prevent duplicate QR generation)
    const existingAttendanceQuery = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("eventId", "==", eventId)
      .limit(1)
      .get();

    if (!existingAttendanceQuery.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Attendance already marked for this event. Cannot generate QR."
      );
    }

    // Generate unique QR ID and nonce
    const crypto = require("crypto");
    const qrId = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + QR_EXPIRY_MS
    );

    // Create QR session document
    const qrSessionData = {
      qrId: qrId,
      userId: userId,
      eventId: eventId,
      expiresAt: expiresAt,
      used: false,
      createdAt: now,
      nonce: nonce
    };

    const qrSessionRef = db.collection("qrSessions").doc();
    await qrSessionRef.set(qrSessionData);

    // Create QR payload (what gets encoded in the QR code)
    const qrPayload = `${qrId}:${nonce}`;

    return {
      success: true,
      qrPayload: qrPayload,
      qrId: qrId,
      expiresAt: expiresAt.toMillis(),
      expiresInSeconds: QR_EXPIRY_MINUTES * 60,
      eventTitle: event.title,
      eventVenue: event.venue
    };
  } catch (error) {
    console.error("Generate Attendance QR Error:", error);

    // Re-throw HttpsError to preserve error details
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred during QR generation.",
      error.message
    );
  }
});

// ============================================
// CLOUD FUNCTION: VALIDATE ATTENDANCE QR
// ============================================
exports.validateAttendanceQR = functions.https.onCall(async (data, context) => {
  try {
    // SECURITY CHECK 1: Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to scan QR codes."
      );
    }

    const scannerUserId = context.auth.uid;

    // Extract QR payload from request
    const { qrId, eventId, nonce, timestamp } = data;

    // VALIDATION 1: Check all required fields are present
    if (!qrId || !eventId || !nonce || !timestamp) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "QR code payload is incomplete. Missing required fields."
      );
    }

    // VALIDATION 2: Verify the QR session exists in Firestore
    const qrSessionQuery = await db
      .collection("qrSessions")
      .where("qrId", "==", qrId)
      .where("eventId", "==", eventId)
      .where("nonce", "==", nonce)
      .limit(1)
      .get();

    if (qrSessionQuery.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "QR code session not found. This QR may be fake or already used."
      );
    }

    const qrSessionDoc = qrSessionQuery.docs[0];
    const qrSession = qrSessionDoc.data();
    const actualUserId = qrSession.userId; // The actual user who generated the QR

    // VALIDATION 3: Check if QR has already been used (replay attack prevention)
    if (qrSession.used === true) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "QR code has already been used. Each QR is single-use only."
      );
    }

    // VALIDATION 4: Check if QR has expired (2 minutes)
    const currentTime = admin.firestore.Timestamp.now().toMillis();
    const expiryTime = qrSession.expiresAt.toMillis();

    if (currentTime > expiryTime) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        `QR code has expired. QR codes are valid for ${QR_EXPIRY_MINUTES} minutes only.`
      );
    }

    // VALIDATION 5: Verify timestamp matches (additional security)
    if (qrSession.createdAt.toMillis() !== timestamp) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "QR code timestamp mismatch. This may be a tampered QR."
      );
    }

    // VALIDATION 6: Verify QR session data integrity
    if (qrSession.eventId !== eventId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "QR code event binding mismatch. Security violation detected."
      );
    }

    // VALIDATION 7: Check if event exists and is today
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Event not found. This event may have been deleted."
      );
    }

    const event = eventDoc.data();
    const eventDate = event.date.toDate();
    const today = new Date();

    // Check if event is today
    if (
      eventDate.getFullYear() !== today.getFullYear() ||
      eventDate.getMonth() !== today.getMonth() ||
      eventDate.getDate() !== today.getDate()
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Event is not scheduled for today. Attendance cannot be marked."
      );
    }

    // VALIDATION 8: Check if attendance already exists (prevent duplicates)
    const existingAttendanceQuery = await db
      .collection("attendance")
      .where("userId", "==", actualUserId)
      .where("eventId", "==", eventId)
      .limit(1)
      .get();

    if (!existingAttendanceQuery.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Attendance already marked for this event. Cannot mark twice."
      );
    }

    // ============================================
    // ALL VALIDATIONS PASSED - PROCESS ATTENDANCE
    // ============================================

    // Use Firestore transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Mark QR session as used
      transaction.update(qrSessionDoc.ref, {
        used: true,
        usedAt: FieldValue.serverTimestamp(),
        scannedBy: scannerUserId,
      });

      // Create attendance record
      const attendanceRef = db.collection("attendance").doc();
      const attendanceData = {
        attendanceId: attendanceRef.id,
        userId: actualUserId,
        eventId: eventId,
        eventTitle: event.title || "Unknown Event",
        eventVenue: event.venue || "Unknown Venue",
        scanTime: FieldValue.serverTimestamp(),
        scannedBy: scannerUserId,
        deviceMetadata: {
          userAgent: context.rawRequest?.headers?.["user-agent"] || "Unknown",
          ip: context.rawRequest?.ip || "Unknown",
        },
        createdAt: FieldValue.serverTimestamp(),
      };

      transaction.set(attendanceRef, attendanceData);

      return {
        attendanceId: attendanceRef.id,
        attendanceData: attendanceData,
      };
    });

    // ============================================
    // SEND EMAIL NOTIFICATION TO AUTHORITY
    // ============================================

    // Get user details
    let userName = actualUserId;
    try {
      const userRecord = await admin.auth().getUser(actualUserId);
      userName = userRecord.displayName || userRecord.email || actualUserId;
    } catch (error) {
      console.error("Error fetching user details:", error);
    }

    // Send email notification
    await sendAttendanceEmail({
      studentName: userName,
      studentId: userId,
      eventTitle: event.title || "Unknown Event",
      eventVenue: event.venue || "Unknown Venue",
      scanTime: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    });

    // Return success response
    return {
      success: true,
      message: "Attendance marked successfully.",
      attendanceId: result.attendanceId,
      eventTitle: event.title,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("QR Validation Error:", error);

    // Re-throw HttpsError to preserve error details
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred during QR validation.",
      error.message
    );
  }
});

// ============================================
// HELPER: SEND EMAIL NOTIFICATION
// ============================================
async function sendAttendanceEmail(data) {
  const { studentName, studentId, eventTitle, eventVenue, scanTime } = data;

  const emailContent = {
    to: AUTHORITY_EMAIL,
    from:
      functions.config().email?.sender ||
      process.env.SENDER_EMAIL ||
      "noreply@klh.edu.in",
    subject: `✅ Attendance Marked: ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #667eea; }
          .footer { margin-top: 20px; padding: 10px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Attendance Confirmation</h2>
          </div>
          <div class="content">
            <p>Attendance has been successfully marked for the following event:</p>
            
            <div class="info-row">
              <span class="label">Student Name:</span> ${studentName}
            </div>
            
            <div class="info-row">
              <span class="label">Student ID:</span> ${studentId}
            </div>
            
            <div class="info-row">
              <span class="label">Event:</span> ${eventTitle}
            </div>
            
            <div class="info-row">
              <span class="label">Venue:</span> ${eventVenue}
            </div>
            
            <div class="info-row">
              <span class="label">Scan Time:</span> ${scanTime}
            </div>
            
            <p style="margin-top: 20px; padding: 10px; background: #dcfce7; border-left: 4px solid #22c55e; border-radius: 4px;">
              <strong>Status:</strong> Attendance verified and recorded successfully.
            </p>
          </div>
          <div class="footer">
            This is an automated notification from the KLH Event Attendance System.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Attendance Marked Successfully
      
      Student Name: ${studentName}
      Student ID: ${studentId}
      Event: ${eventTitle}
      Venue: ${eventVenue}
      Scan Time: ${scanTime}
      
      This is an automated notification from the KLH Event Attendance System.
    `,
  };

  try {
    if (sgMail.apiKey) {
      await sgMail.send(emailContent);
      console.log("Email sent successfully to:", AUTHORITY_EMAIL);
    } else {
      console.warn(
        "SendGrid API key not configured. Email notification skipped."
      );
      console.log("Email content:", emailContent);
    }
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error - email failure shouldn't block attendance marking
  }
}

// ============================================
// CLOUD FUNCTION: CREATE QR SESSION (ALTERNATIVE)
// ============================================
// Optional: Backend-generated QR sessions for extra security
exports.createQrSession = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const userId = context.auth.uid;
    const { eventId } = data;

    if (!eventId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Event ID is required."
      );
    }

    // Verify event exists and is today
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found.");
    }

    const event = eventDoc.data();
    const eventDate = event.date.toDate();
    const today = new Date();

    if (
      eventDate.getFullYear() !== today.getFullYear() ||
      eventDate.getMonth() !== today.getMonth() ||
      eventDate.getDate() !== today.getDate()
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Event is not scheduled for today."
      );
    }

    // Check if attendance already exists
    const existingAttendanceQuery = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("eventId", "==", eventId)
      .limit(1)
      .get();

    if (!existingAttendanceQuery.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Attendance already marked for this event."
      );
    }

    // Generate cryptographically secure nonce
    const crypto = require("crypto");
    const nonce = crypto.randomBytes(32).toString("hex");

    const now = admin.firestore.Timestamp.now();
    const expiryTime = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + QR_EXPIRY_MS
    );

    // Create QR session
    const qrSessionRef = db.collection("qr_sessions").doc();
    await qrSessionRef.set({
      userId: userId,
      eventId: eventId,
      nonce: nonce,
      createdAt: now,
      expiresAt: expiryTime,
      used: false,
    });

    return {
      success: true,
      sessionId: qrSessionRef.id,
      qrPayload: {
        userId: userId,
        eventId: eventId,
        nonce: nonce,
        timestamp: now.toMillis(),
      },
      expiresAt: expiryTime.toMillis(),
    };
  } catch (error) {
    console.error("Create QR Session Error:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      "Failed to create QR session.",
      error.message
    );
  }
});

// ============================================
// CLOUD FUNCTION: CLEANUP EXPIRED QR SESSIONS
// ============================================
// Scheduled function to clean up expired QR sessions
// Runs every hour
exports.cleanupExpiredQrSessions = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // Find expired sessions
    const expiredSessions = await db
      .collection("qrSessions")
      .where("expiresAt", "<=", now)
      .limit(500)
      .get();

    if (expiredSessions.empty) {
      console.log("No expired QR sessions to clean up.");
      return null;
    }

    // Batch delete
    const batch = db.batch();
    expiredSessions.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${expiredSessions.size} expired QR sessions.`);

    return null;
  });

// ============================================
// ROOM ALLOCATION SYSTEM - CLOUD FUNCTIONS
// ============================================

// Helper: Check if user has required role
async function checkUserRole(userId, allowedRoles) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return { valid: false, message: "User profile not found." };
    }

    const userRole = userDoc.data().role;
    if (!allowedRoles.includes(userRole)) {
      return {
        valid: false,
        message: `Access denied. Required role: ${allowedRoles.join(
          " or "
        )}. Your role: ${userRole}`,
      };
    }

    return { valid: true, role: userRole };
  } catch (error) {
    console.error("Error checking user role:", error);
    return { valid: false, message: "Error verifying user permissions." };
  }
}

// Helper: Check for time slot conflicts
async function checkTimeSlotConflict(
  roomId,
  date,
  timeSlot,
  duration,
  excludeAllocationId = null
) {
  try {
    // Parse time slot (e.g., "09:00-10:00")
    const [startTime, endTime] = timeSlot.split("-");

    // Query existing allocations for the room on the same date
    let query = db
      .collection("allocations")
      .where("roomId", "==", roomId)
      .where("date", "==", date);

    const snapshot = await query.get();

    // Check each allocation for overlap
    for (const doc of snapshot.docs) {
      if (excludeAllocationId && doc.id === excludeAllocationId) {
        continue; // Skip the current allocation if updating
      }

      const allocation = doc.data();
      const [existingStart, existingEnd] = allocation.timeSlot.split("-");

      // Check for time overlap
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        return {
          conflict: true,
          message: `Room already allocated at ${allocation.timeSlot}`,
          conflictingAllocation: {
            id: doc.id,
            sectionName: allocation.sectionName,
            timeSlot: allocation.timeSlot,
          },
        };
      }
    }

    return { conflict: false };
  } catch (error) {
    console.error("Error checking time slot conflict:", error);
    throw error;
  }
}

// ============================================
// CLOUD FUNCTION: CREATE ROOM ALLOCATION
// ============================================
exports.createRoomAllocation = functions.https.onCall(async (data, context) => {
  try {
    // AUTHENTICATION CHECK
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const userId = context.auth.uid;

    // AUTHORIZATION CHECK - Faculty or Admin only
    const roleCheck = await checkUserRole(userId, ["faculty", "admin"]);
    if (!roleCheck.valid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        roleCheck.message
      );
    }

    // EXTRACT DATA
    const {
      roomId,
      sectionId,
      date,
      timeSlot,
      duration,
      sectionName,
      department,
      classStrength,
    } = data;

    // VALIDATION: Required fields
    if (!roomId || !sectionId || !date || !timeSlot || !classStrength) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: roomId, sectionId, date, timeSlot, classStrength"
      );
    }

    // VALIDATION: Check room exists
    const roomDoc = await db.collection("rooms").doc(roomId).get();
    if (!roomDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Room not found.");
    }

    const room = roomDoc.data();

    // VALIDATION: Check room availability
    if (room.availabilityStatus !== "available") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Room is currently unavailable."
      );
    }

    // VALIDATION: Check capacity
    if (classStrength > room.capacity) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Room capacity (${room.capacity}) is insufficient for class strength (${classStrength}).`
      );
    }

    // VALIDATION: Check time slot conflicts
    const conflictCheck = await checkTimeSlotConflict(
      roomId,
      date,
      timeSlot,
      duration
    );
    if (conflictCheck.conflict) {
      throw new functions.https.HttpsError(
        "already-exists",
        conflictCheck.message,
        conflictCheck.conflictingAllocation
      );
    }

    // VALIDATION: Check section exists
    const sectionDoc = await db.collection("sections").doc(sectionId).get();
    if (!sectionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Section not found.");
    }

    // CREATE ALLOCATION using transaction
    const allocationData = {
      roomId: roomId,
      roomName: room.roomName,
      roomNumber: room.roomNumber,
      roomCapacity: room.capacity,
      sectionId: sectionId,
      sectionName: sectionName || sectionDoc.data().sectionName,
      department: department || sectionDoc.data().department,
      classStrength: classStrength,
      date: date,
      timeSlot: timeSlot,
      duration: duration || 60,
      allocatedBy: userId,
      allocatedByRole: roleCheck.role,
      createdAt: FieldValue.serverTimestamp(),
      status: "active",
    };

    const allocationRef = db.collection("allocations").doc();
    await allocationRef.set(allocationData);

    return {
      success: true,
      message: "Room allocated successfully.",
      allocationId: allocationRef.id,
      allocation: allocationData,
    };
  } catch (error) {
    console.error("Room allocation error:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while creating allocation.",
      error.message
    );
  }
});

// ============================================
// CLOUD FUNCTION: GET AI SUGGESTIONS (GEMINI API)
// ============================================
exports.getAiRoomSuggestions = functions.https.onCall(async (data, context) => {
  try {
    // AUTHENTICATION CHECK
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const userId = context.auth.uid;

    // AUTHORIZATION CHECK - Faculty or Admin only
    const roleCheck = await checkUserRole(userId, ["faculty", "admin"]);
    if (!roleCheck.valid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        roleCheck.message
      );
    }

    // EXTRACT DATA
    const {
      classStrength,
      date,
      timeSlot,
      duration,
      preferredRoomType,
      department,
    } = data;

    // VALIDATION
    if (!classStrength || !date || !timeSlot) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: classStrength, date, timeSlot"
      );
    }

    // FETCH AVAILABLE ROOMS
    let roomsQuery = db
      .collection("rooms")
      .where("availabilityStatus", "==", "available")
      .where("capacity", ">=", classStrength);

    if (preferredRoomType) {
      roomsQuery = roomsQuery.where("roomType", "==", preferredRoomType);
    }

    const roomsSnapshot = await roomsQuery.get();

    if (roomsSnapshot.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "No available rooms found matching the criteria."
      );
    }

    // Filter out rooms with conflicts
    const availableRooms = [];
    for (const doc of roomsSnapshot.docs) {
      const room = { id: doc.id, ...doc.data() };
      const conflictCheck = await checkTimeSlotConflict(
        room.id,
        date,
        timeSlot,
        duration
      );

      if (!conflictCheck.conflict) {
        availableRooms.push(room);
      }
    }

    if (availableRooms.length === 0) {
      throw new functions.https.HttpsError(
        "not-found",
        "No available rooms found for the selected time slot."
      );
    }

    // GEMINI API INTEGRATION
    const geminiApiKey =
      functions.config().gemini?.key || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      // Fallback: Simple algorithmic suggestion
      return simpleRoomSuggestion(
        availableRooms,
        classStrength,
        preferredRoomType
      );
    }

    // Call Gemini API
    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
You are an AI assistant for a university room allocation system.

Given the following details:
- Class Strength: ${classStrength} students
- Date: ${date}
- Time Slot: ${timeSlot}
- Duration: ${duration || 60} minutes
- Preferred Room Type: ${preferredRoomType || "any"}
- Department: ${department || "General"}

Available Rooms:
${availableRooms
  .map(
    (room, index) => `
${index + 1}. ${room.roomName} (${room.roomNumber})
   - Type: ${room.roomType}
   - Capacity: ${room.capacity}
   - Utilization: ${Math.round((classStrength / room.capacity) * 100)}%
`
  )
  .join("\n")}

Task: Suggest the top 3 most suitable rooms with reasoning.

Consider:
1. Optimal capacity utilization (avoid oversized rooms)
2. Room type match (prefer matching types)
3. Minimize wasted space
4. Accessibility and practical usage

Respond in JSON format:
{
  "suggestions": [
    {
      "roomId": "room_id",
      "roomName": "Room Name",
      "priority": 1,
      "reasoning": "Why this room is best",
      "capacityUtilization": 85,
      "pros": ["benefit 1", "benefit 2"],
      "cons": ["limitation 1"]
    }
  ],
  "overallRecommendation": "Summary of best choice"
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResponse = JSON.parse(jsonMatch[0]);

        // Store suggestion in Firestore (temporary)
        const suggestionRef = db.collection("ai_suggestions").doc();
        await suggestionRef.set({
          userId: userId,
          requestData: data,
          aiResponse: aiResponse,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(
            Date.now() + 30 * 60 * 1000 // 30 minutes
          ),
        });

        return {
          success: true,
          suggestions: aiResponse.suggestions,
          overallRecommendation: aiResponse.overallRecommendation,
          suggestionId: suggestionRef.id,
          availableRoomsCount: availableRooms.length,
        };
      }
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      // Fallback to simple suggestion
      return simpleRoomSuggestion(
        availableRooms,
        classStrength,
        preferredRoomType
      );
    }

    // Fallback
    return simpleRoomSuggestion(
      availableRooms,
      classStrength,
      preferredRoomType
    );
  } catch (error) {
    console.error("AI suggestion error:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while generating suggestions.",
      error.message
    );
  }
});

// Helper: Simple algorithmic room suggestion (fallback)
function simpleRoomSuggestion(rooms, classStrength, preferredRoomType) {
  // Sort rooms by capacity utilization (closest to class strength)
  const rankedRooms = rooms.map((room) => {
    const utilization = (classStrength / room.capacity) * 100;
    const wastedSpace = room.capacity - classStrength;
    const typeMatch = preferredRoomType && room.roomType === preferredRoomType;

    return {
      ...room,
      utilization: utilization,
      wastedSpace: wastedSpace,
      score: utilization - wastedSpace * 0.5 + (typeMatch ? 20 : 0),
    };
  });

  // Sort by score (higher is better)
  rankedRooms.sort((a, b) => b.score - a.score);

  // Take top 3
  const suggestions = rankedRooms.slice(0, 3).map((room, index) => ({
    roomId: room.id,
    roomName: room.roomName,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    capacity: room.capacity,
    priority: index + 1,
    reasoning:
      `${Math.round(room.utilization)}% capacity utilization. ` +
      `${room.wastedSpace} excess seats. ` +
      (room.roomType === preferredRoomType ? "Type match. " : ""),
    capacityUtilization: Math.round(room.utilization),
    pros: [
      `Capacity: ${room.capacity} (${Math.round(room.utilization)}% utilized)`,
      `Room Type: ${room.roomType}`,
    ],
    cons: room.wastedSpace > 20 ? [`${room.wastedSpace} wasted seats`] : [],
  }));

  return {
    success: true,
    suggestions: suggestions,
    overallRecommendation: `${suggestions[0].roomName} offers the best capacity utilization at ${suggestions[0].capacityUtilization}%.`,
    availableRoomsCount: rooms.length,
    source: "algorithmic", // Indicates fallback was used
  };
}

// ============================================
// CLOUD FUNCTION: VALIDATE ALLOCATION (Pre-check)
// ============================================
exports.validateAllocation = functions.https.onCall(async (data, context) => {
  try {
    // AUTHENTICATION CHECK
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const userId = context.auth.uid;

    // AUTHORIZATION CHECK
    const roleCheck = await checkUserRole(userId, ["faculty", "admin"]);
    if (!roleCheck.valid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        roleCheck.message
      );
    }

    const { roomId, date, timeSlot, duration, classStrength } = data;

    // Check room
    const roomDoc = await db.collection("rooms").doc(roomId).get();
    if (!roomDoc.exists) {
      return { valid: false, message: "Room not found." };
    }

    const room = roomDoc.data();

    // Check availability
    if (room.availabilityStatus !== "available") {
      return { valid: false, message: "Room is unavailable." };
    }

    // Check capacity
    if (classStrength > room.capacity) {
      return {
        valid: false,
        message: `Insufficient capacity. Room: ${room.capacity}, Required: ${classStrength}`,
      };
    }

    // Check conflicts
    const conflictCheck = await checkTimeSlotConflict(
      roomId,
      date,
      timeSlot,
      duration
    );
    if (conflictCheck.conflict) {
      return {
        valid: false,
        message: conflictCheck.message,
        conflict: conflictCheck.conflictingAllocation,
      };
    }

    return {
      valid: true,
      message: "Allocation is valid.",
      room: {
        name: room.roomName,
        capacity: room.capacity,
        utilization: Math.round((classStrength / room.capacity) * 100),
      },
    };
  } catch (error) {
    console.error("Validation error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Validation failed.",
      error.message
    );
  }
});

// ============================================
// ISSUEHUB SYSTEM - QUESTION MANAGEMENT
// ============================================

// CREATE QUESTION FUNCTION
exports.createQuestion = functions.https.onCall(async (data, context) => {
  // Check authentication - only students can post questions
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is a student
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "student") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only students can post questions."
    );
  }

  // Validate input data
  const { title, description, tags = [] } = data;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question title is required and must be a non-empty string."
    );
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question description is required and must be a non-empty string."
    );
  }

  if (title.length > 200) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question title must be less than 200 characters."
    );
  }

  if (description.length > 2000) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question description must be less than 2000 characters."
    );
  }

  // Validate tags
  if (!Array.isArray(tags) || tags.length > 5) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Tags must be an array with maximum 5 tags."
    );
  }

  // Check for duplicate questions using text normalization
  const normalizedTitle = title.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const normalizedDesc = description.toLowerCase().trim().replace(/[^\w\s]/g, '');

  try {
    // Query for potentially similar questions
    const existingQuestions = await db.collection("questions")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const similarQuestions = [];
    existingQuestions.forEach(doc => {
      const question = doc.data();
      const existingNormalizedTitle = question.normalizedText?.title?.toLowerCase() || '';
      const existingNormalizedDesc = question.normalizedText?.description?.toLowerCase() || '';

      // Simple similarity check - can be enhanced with more sophisticated algorithms
      const titleSimilarity = calculateSimilarity(normalizedTitle, existingNormalizedTitle);
      const descSimilarity = calculateSimilarity(normalizedDesc, existingNormalizedDesc);

      if (titleSimilarity > 0.8 || descSimilarity > 0.6) {
        similarQuestions.push({
          id: doc.id,
          title: question.title,
          similarity: Math.max(titleSimilarity, descSimilarity)
        });
      }
    });

    // If very similar questions found, suggest them
    if (similarQuestions.length > 0) {
      return {
        success: false,
        similarQuestions: similarQuestions.slice(0, 3),
        message: "Similar questions found. Please review before posting."
      };
    }

    // Create question document
    const questionData = {
      title: title.trim(),
      description: description.trim(),
      normalizedText: {
        title: normalizedTitle,
        description: normalizedDesc
      },
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      upvotesCount: 0,
      answersCount: 0,
      tags: tags,
      category: determineCategory(tags, title, description)
    };

    const questionRef = await db.collection("questions").add(questionData);

    // Update user metrics
    await updateUserMetrics(context.auth.uid, 'questionsPosted', 1);

    console.log(`Question created: "${title}" (ID: ${questionRef.id}) by user ${context.auth.uid}`);

    return {
      success: true,
      questionId: questionRef.id,
      message: "Question posted successfully.",
      question: {
        id: questionRef.id,
        ...questionData,
        createdAt: new Date()
      }
    };
  } catch (error) {
    console.error("Error creating question:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create question.",
      error.message
    );
  }
});

// Helper function to calculate text similarity (simple implementation)
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const commonWords = words1.filter(word =>
    word.length > 3 && words2.includes(word)
  );

  return commonWords.length / Math.max(words1.length, words2.length);
}

// Helper function to determine question category based on tags and content
function determineCategory(tags, title, description) {
  const content = `${title} ${description}`.toLowerCase();

  if (tags.includes('academics') || content.includes('exam') || content.includes('grade') || content.includes('subject')) {
    return 'Academics';
  }
  if (tags.includes('library') || content.includes('book') || content.includes('research')) {
    return 'Library';
  }
  if (tags.includes('wifi') || tags.includes('internet') || content.includes('network') || content.includes('connection')) {
    return 'Infrastructure';
  }
  if (tags.includes('club') || content.includes('club') || content.includes('society')) {
    return 'Clubs';
  }
  if (tags.includes('bus') || tags.includes('transport') || content.includes('travel')) {
    return 'Transport';
  }
  if (tags.includes('scholarship') || tags.includes('financial') || content.includes('money') || content.includes('fee')) {
    return 'Financial';
  }

  return 'General';
}

// POST ANSWER FUNCTION
exports.postAnswer = functions.https.onCall(async (data, context) => {
  // Check authentication - only students can post answers
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is a student
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "student") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only students can post answers."
    );
  }

  // Validate input data
  const { questionId, content } = data;

  if (!questionId || typeof questionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question ID is required and must be a string."
    );
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Answer content is required and must be a non-empty string."
    );
  }

  if (content.length > 2000) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Answer content must be less than 2000 characters."
    );
  }

  try {
    // Verify question exists
    const questionDoc = await db.collection("questions").doc(questionId).get();
    if (!questionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Question not found."
      );
    }

    // Create answer document
    const answerData = {
      questionId: questionId,
      content: content.trim(),
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      upvotesCount: 0
    };

    const answerRef = await db.collection("answers").add(answerData);

    // Update question's answer count
    await db.collection("questions").doc(questionId).update({
      answersCount: admin.firestore.FieldValue.increment(1)
    });

    // Update user metrics
    await updateUserMetrics(context.auth.uid, 'answersPosted', 1);

    console.log(`Answer posted to question ${questionId} (Answer ID: ${answerRef.id}) by user ${context.auth.uid}`);

    return {
      success: true,
      answerId: answerRef.id,
      message: "Answer posted successfully.",
      answer: {
        id: answerRef.id,
        ...answerData,
        createdAt: new Date()
      }
    };
  } catch (error) {
    console.error("Error posting answer:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to post answer.",
      error.message
    );
  }
});

// UPVOTE QUESTION FUNCTION
exports.upvoteQuestion = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is a student
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "student") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only students can upvote."
    );
  }

  const { questionId } = data;

  if (!questionId || typeof questionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Question ID is required and must be a string."
    );
  }

  try {
    // Check if user already upvoted this question
    const existingUpvote = await db.collection("questionUpvotes")
      .where("userId", "==", context.auth.uid)
      .where("questionId", "==", questionId)
      .limit(1)
      .get();

    if (!existingUpvote.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You have already upvoted this question."
      );
    }

    // Verify question exists
    const questionDoc = await db.collection("questions").doc(questionId).get();
    if (!questionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Question not found."
      );
    }

    const questionData = questionDoc.data();

    // Create upvote record
    await db.collection("questionUpvotes").add({
      userId: context.auth.uid,
      questionId: questionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update question upvotes count
    await db.collection("questions").doc(questionId).update({
      upvotesCount: admin.firestore.FieldValue.increment(1)
    });

    // Update user metrics for both upvoter and question author
    await updateUserMetrics(context.auth.uid, 'totalUpvotes', 1);
    if (questionData.createdBy !== context.auth.uid) {
      await updateUserMetrics(questionData.createdBy, 'totalUpvotes', 1);
    }

    console.log(`Question ${questionId} upvoted by user ${context.auth.uid}`);

    return {
      success: true,
      message: "Question upvoted successfully."
    };
  } catch (error) {
    console.error("Error upvoting question:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to upvote question.",
      error.message
    );
  }
});

// UPVOTE ANSWER FUNCTION
exports.upvoteAnswer = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is a student
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "student") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only students can upvote."
    );
  }

  const { answerId } = data;

  if (!answerId || typeof answerId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Answer ID is required and must be a string."
    );
  }

  try {
    // Check if user already upvoted this answer
    const existingUpvote = await db.collection("answerUpvotes")
      .where("userId", "==", context.auth.uid)
      .where("answerId", "==", answerId)
      .limit(1)
      .get();

    if (!existingUpvote.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You have already upvoted this answer."
      );
    }

    // Verify answer exists
    const answerDoc = await db.collection("answers").doc(answerId).get();
    if (!answerDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Answer not found."
      );
    }

    const answerData = answerDoc.data();

    // Create upvote record
    await db.collection("answerUpvotes").add({
      userId: context.auth.uid,
      answerId: answerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update answer upvotes count
    await db.collection("answers").doc(answerId).update({
      upvotesCount: admin.firestore.FieldValue.increment(1)
    });

    // Update user metrics for both upvoter and answer author
    await updateUserMetrics(context.auth.uid, 'totalUpvotes', 1);
    if (answerData.createdBy !== context.auth.uid) {
      await updateUserMetrics(answerData.createdBy, 'totalUpvotes', 1);
    }

    console.log(`Answer ${answerId} upvoted by user ${context.auth.uid}`);

    return {
      success: true,
      message: "Answer upvoted successfully."
    };
  } catch (error) {
    console.error("Error upvoting answer:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to upvote answer.",
      error.message
    );
  }
});

// GENERATE LEADERBOARD FUNCTION
exports.generateLeaderboard = functions.https.onCall(async (data, context) => {
  // Check authentication - anyone can view leaderboard but only backend should generate
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  try {
    // Get all users with their metrics
    const usersSnapshot = await db.collection("users")
      .where("role", "==", "student")
      .get();

    const leaderboard = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      // Calculate score: primary = totalUpvotes, secondary = answersPosted
      const score = (userData.totalUpvotes || 0) * 1000 + (userData.answersPosted || 0);

      if (score > 0) { // Only include users with activity
        leaderboard.push({
          userId: userDoc.id,
          name: userData.name || userData.email || 'Anonymous',
          totalUpvotes: userData.totalUpvotes || 0,
          answersPosted: userData.answersPosted || 0,
          questionsPosted: userData.questionsPosted || 0,
          score: score
        });
      }
    }

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);

    // Add ranks and limit to top 50
    const topUsers = leaderboard.slice(0, 50).map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Store leaderboard snapshot
    const leaderboardData = {
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      users: topUsers
    };

    await db.collection("leaderboard").doc("current").set(leaderboardData);

    console.log(`Leaderboard generated with ${topUsers.length} users`);

    return {
      success: true,
      leaderboard: topUsers,
      message: `Leaderboard generated with ${topUsers.length} active contributors.`
    };
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate leaderboard.",
      error.message
    );
  }
});

// Helper function to update user metrics
async function updateUserMetrics(userId, metric, increment = 1) {
  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      [metric]: admin.firestore.FieldValue.increment(increment)
    });
  } catch (error) {
    console.error(`Error updating user ${metric}:`, error);
    // Don't throw error for metrics updates to avoid breaking main operations
  }
}

// ============================================
// ROOMSYNC SYSTEM - ROOM MANAGEMENT
// ============================================

// CREATE ROOM FUNCTION
exports.createRoom = functions.https.onCall(async (data, context) => {
  // Check authentication and authorization
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is faculty or admin
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "faculty" && userData.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only faculty and admin users can create rooms."
    );
  }

  // Validate input data
  const { roomName, capacity, roomType } = data;

  if (!roomName || typeof roomName !== "string" || roomName.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Room name is required and must be a non-empty string."
    );
  }

  if (!capacity || typeof capacity !== "number" || capacity <= 0 || capacity > 500) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Capacity must be a number between 1 and 500."
    );
  }

  const validRoomTypes = ["classroom", "lab", "seminar"];
  if (!roomType || !validRoomTypes.includes(roomType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Room type must be one of: classroom, lab, seminar."
    );
  }

  try {
    // Check if room name already exists
    const existingRoom = await db
      .collection("rooms")
      .where("roomName", "==", roomName.trim())
      .get();

    if (!existingRoom.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "A room with this name already exists."
      );
    }

    // Create room document
    const roomData = {
      roomName: roomName.trim(),
      capacity: capacity,
      roomType: roomType,
      isActive: true,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const roomRef = await db.collection("rooms").add(roomData);

    console.log(`Room created: ${roomName} (ID: ${roomRef.id})`);

    return {
      success: true,
      roomId: roomRef.id,
      message: "Room created successfully.",
    };
  } catch (error) {
    console.error("Error creating room:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create room.",
      error.message
    );
  }
});

// CREATE SECTION FUNCTION
exports.createSection = functions.https.onCall(async (data, context) => {
  // Check authentication and authorization
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is faculty or admin
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "faculty" && userData.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only faculty and admin users can create sections."
    );
  }

  // Validate input data
  const { department, sectionName, classStrength, requiredRoomType } = data;

  if (!department || typeof department !== "string" || department.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Department is required and must be a non-empty string."
    );
  }

  if (!sectionName || typeof sectionName !== "string" || sectionName.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Section name is required and must be a non-empty string."
    );
  }

  if (!classStrength || typeof classStrength !== "number" || classStrength <= 0 || classStrength > 200) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Class strength must be a number between 1 and 200."
    );
  }

  const validRoomTypes = ["classroom", "lab", "seminar"];
  if (requiredRoomType && !validRoomTypes.includes(requiredRoomType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Required room type must be one of: classroom, lab, seminar."
    );
  }

  try {
    // Check if section name already exists
    const existingSection = await db
      .collection("sections")
      .where("sectionName", "==", sectionName.trim())
      .where("department", "==", department.trim())
      .get();

    if (!existingSection.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "A section with this name already exists in this department."
      );
    }

    // Create section document
    const sectionData = {
      department: department.trim(),
      sectionName: sectionName.trim(),
      classStrength: classStrength,
      requiredRoomType: requiredRoomType || "classroom",
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const sectionRef = await db.collection("sections").add(sectionData);

    console.log(`Section created: ${sectionName} (ID: ${sectionRef.id})`);

    return {
      success: true,
      sectionId: sectionRef.id,
      message: "Section created successfully.",
    };
  } catch (error) {
    console.error("Error creating section:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create section.",
      error.message
    );
  }
});

// ALLOCATE ROOM FUNCTION
exports.allocateRoom = functions.https.onCall(async (data, context) => {
  // Check authentication and authorization
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is faculty or admin
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "faculty" && userData.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only faculty and admin users can allocate rooms."
    );
  }

  // Validate input data
  const { roomId, sectionId, date, startTime, endTime } = data;

  if (!roomId || !sectionId || !date || !startTime || !endTime) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "All allocation fields are required."
    );
  }

  try {
    // Get room and section data
    const [roomDoc, sectionDoc] = await Promise.all([
      db.collection("rooms").doc(roomId).get(),
      db.collection("sections").doc(sectionId).get(),
    ]);

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Room not found."
      );
    }

    if (!sectionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Section not found."
      );
    }

    const room = roomDoc.data();
    const section = sectionDoc.data();

    // Validate capacity
    if (room.capacity < section.classStrength) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Room capacity (${room.capacity}) is less than section strength (${section.classStrength}).`
      );
    }

    // Validate room type compatibility
    if (section.requiredRoomType && room.roomType !== section.requiredRoomType) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Room type (${room.roomType}) does not match required type (${section.requiredRoomType}).`
      );
    }

    // Check for conflicts - overlapping allocations for same room
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const conflicts = await db
      .collection("allocations")
      .where("roomId", "==", roomId)
      .where("date", "==", date)
      .get();

    for (const conflict of conflicts.docs) {
      const allocation = conflict.data();
      const existingStart = new Date(`${allocation.date}T${allocation.startTime}`);
      const existingEnd = new Date(`${allocation.date}T${allocation.endTime}`);

      // Check for time overlap
      if (startDateTime < existingEnd && endDateTime > existingStart) {
        throw new functions.https.HttpsError(
          "already-exists",
          `Room is already allocated during this time slot (${allocation.startTime} - ${allocation.endTime}).`
        );
      }
    }

    // Check for section conflicts - same section allocated elsewhere
    const sectionConflicts = await db
      .collection("allocations")
      .where("sectionId", "==", sectionId)
      .where("date", "==", date)
      .get();

    for (const conflict of sectionConflicts.docs) {
      const allocation = conflict.data();
      const existingStart = new Date(`${allocation.date}T${allocation.startTime}`);
      const existingEnd = new Date(`${allocation.date}T${allocation.endTime}`);

      // Check for time overlap
      if (startDateTime < existingEnd && endDateTime > existingStart) {
        throw new functions.https.HttpsError(
          "already-exists",
          `Section is already allocated to another room during this time slot (${allocation.startTime} - ${allocation.endTime}).`
        );
      }
    }

    // Create allocation
    const allocationData = {
      roomId: roomId,
      sectionId: sectionId,
      date: date,
      startTime: startTime,
      endTime: endTime,
      allocatedBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const allocationRef = await db.collection("allocations").add(allocationData);

    console.log(`Room allocated: ${room.roomName} for ${section.sectionName} (ID: ${allocationRef.id})`);

    return {
      success: true,
      allocationId: allocationRef.id,
      message: "Room allocated successfully.",
    };
  } catch (error) {
    console.error("Error allocating room:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to allocate room.",
      error.message
    );
  }
});

// AI ROOM SUGGESTIONS FUNCTION (Simplified - without Gemini for now)
exports.suggestRooms = functions.https.onCall(async (data, context) => {
  // Check authentication and authorization
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  // Check if user is faculty or admin
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found."
    );
  }

  const userData = userDoc.data();
  if (userData.role !== "faculty" && userData.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only faculty and admin users can get room suggestions."
    );
  }

  // Validate input data
  const { sectionStrength, duration = 60, roomType = "classroom" } = data;

  if (!sectionStrength || typeof sectionStrength !== "number" || sectionStrength <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Section strength is required and must be a positive number."
    );
  }

  const validRoomTypes = ["classroom", "lab", "seminar"];
  if (!validRoomTypes.includes(roomType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Room type must be one of: classroom, lab, seminar."
    );
  }

  try {
    // Query available rooms that meet criteria
    let query = db.collection("rooms")
      .where("isActive", "==", true)
      .where("capacity", ">=", sectionStrength);

    // Add room type filter if specified
    if (roomType !== "classroom") {
      query = query.where("roomType", "==", roomType);
    }

    const roomsSnapshot = await query.get();

    if (roomsSnapshot.empty) {
      return {
        success: true,
        rooms: [],
        message: "No suitable rooms found."
      };
    }

    // Convert to array and sort by capacity (minimal unused capacity first)
    const rooms = [];
    roomsSnapshot.forEach(doc => {
      rooms.push({
        roomId: doc.id,
        ...doc.data()
      });
    });

    // Sort by minimal wasted capacity (best fit first)
    rooms.sort((a, b) => {
      const wasteA = a.capacity - sectionStrength;
      const wasteB = b.capacity - sectionStrength;
      return wasteA - wasteB;
    });

    // Limit to top 5 suggestions
    const suggestions = rooms.slice(0, 5);

    console.log(`Room suggestions generated: ${suggestions.length} rooms for ${sectionStrength} students`);

    return {
      success: true,
      rooms: suggestions,
      message: `${suggestions.length} room suggestions generated.`,
    };
  } catch (error) {
    console.error("Error generating room suggestions:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate room suggestions.",
      error.message
    );
  }
});