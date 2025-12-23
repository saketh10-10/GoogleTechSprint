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
// CLOUD FUNCTION: VALIDATE QR CODE & MARK ATTENDANCE
// ============================================
exports.validateQrScan = functions.https.onCall(async (data, context) => {
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
    const { userId, eventId, nonce, timestamp } = data;

    // VALIDATION 1: Check all required fields are present
    if (!userId || !eventId || !nonce || !timestamp) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "QR code payload is incomplete. Missing required fields."
      );
    }

    // VALIDATION 2: Verify the QR session exists in Firestore
    const qrSessionQuery = await db
      .collection("qr_sessions")
      .where("userId", "==", userId)
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

    // VALIDATION 6: Verify user-event binding
    if (qrSession.userId !== userId || qrSession.eventId !== eventId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "QR code user-event binding mismatch. Security violation detected."
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
      .where("userId", "==", userId)
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
        userId: userId,
        eventId: eventId,
        eventTitle: event.title || "Unknown Event",
        eventVenue: event.venue || "Unknown Venue",
        scanTimestamp: FieldValue.serverTimestamp(),
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
    let userName = userId;
    try {
      const userRecord = await admin.auth().getUser(userId);
      userName = userRecord.displayName || userRecord.email || userId;
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
      .collection("qr_sessions")
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
