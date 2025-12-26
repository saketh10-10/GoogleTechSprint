// Firebase Configuration and Initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * FIREBASE CONFIGURATION
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForDevelopmentPurposesOnly",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// Check if we have valid Firebase configuration
const hasValidConfig = firebaseConfig.projectId !== 'demo-project' || 
                       process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

if (!hasValidConfig && typeof window !== 'undefined') {
  console.error('❌ Invalid Firebase configuration detected!');
  console.error('📋 Please either:');
  console.error('   1. Set up real Firebase credentials in .env.local');
  console.error('   2. OR run emulators: firebase emulators:start');
  console.error('   3. AND set NEXT_PUBLIC_USE_EMULATORS=true in .env.local');
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log('🔥 Firebase app initialized:', firebaseConfig.projectId);
  }
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    console.log('🔥 Using existing Firebase app');
  }
}

// Initialize Firebase services
const auth: Auth = getAuth(app);

// Initialize Firestore - ensure singleton pattern
let db: Firestore;
try {
  // First, try to get any existing Firestore instance
  const existingApps = getApps();
  if (existingApps.length > 0) {
    try {
      db = getFirestore(app);
      if (typeof window !== 'undefined') {
        console.log('✅ Using existing Firestore instance');
      }
    } catch (e) {
      // If getFirestore fails, initialize new instance
      db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true,
      });
      if (typeof window !== 'undefined') {
        console.log('✅ Firestore initialized with custom settings');
      }
    }
  } else {
    // No existing app, initialize fresh
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
    });
    if (typeof window !== 'undefined') {
      console.log('✅ Firestore initialized');
    }
  }
} catch (error: any) {
  // Fallback: try one more time with getFirestore
  console.warn('⚠️ Firestore initialization attempt failed, trying fallback...', error.message);
  try {
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      console.log('✅ Firestore initialized via fallback');
    }
  } catch (fallbackError: any) {
    console.error('❌ Fatal: Could not initialize Firestore:', fallbackError);
    throw new Error(`Firestore initialization failed: ${fallbackError.message}`);
  }
}

const functions: Functions = getFunctions(app, 'us-central1');

// Flag to prevent multiple emulator connections during HMR
const EMULATORS_CONNECTED_SYMBOL = Symbol.for('firebase.emulators.connected');

if (process.env.NODE_ENV === 'development') {
  const globalObj = global as any;

  if (!globalObj[EMULATORS_CONNECTED_SYMBOL]) {
    // ⚠️ EMULATORS ARE NOW OPT-IN ONLY
    // Set NEXT_PUBLIC_USE_EMULATORS=true in .env.local to enable local development
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

    if (useEmulators) {
      console.log(`🔧 Firebase [${firebaseConfig.projectId}]: Connecting to local emulators...`);
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectFunctionsEmulator(functions, 'localhost', 5001);

        globalObj[EMULATORS_CONNECTED_SYMBOL] = true;
        console.log('✅ Firebase: Connected to local emulators.');
      } catch (error: any) {
        if (error.code !== 'failed-precondition') {
          console.error('❌ Firebase Emulator Connection Error:', error);
        }
      }
    } else {
      // Logic for when emulators are NOT used
      console.log(`🌐 Firebase [${firebaseConfig.projectId}]: Connected to Cloud/Production backend.`);
      if (firebaseConfig.projectId === 'demo-project') {
        console.warn('⚠️ WARNING: Using "demo-project" without emulators. Cloud functions and database operations may fail due to permissions or CORS.');
        console.log('👉 To fix this, run "firebase emulators:start" and set "NEXT_PUBLIC_USE_EMULATORS=true" in .env.local');
      }
    }
  }
}

// Enable offline persistence for better offline support (only in browser)
if (typeof window !== 'undefined' && db) {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('✅ Firestore offline persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Firestore persistence not available in this browser');
      } else {
        console.error('❌ Firestore persistence error:', err);
      }
    });
}

export { app, auth, db, functions };

// Validation function to check if Firestore is properly initialized
export const isFirestoreInitialized = (): boolean => {
  try {
    if (!db) {
      console.error('❌ Firestore instance is not defined');
      return false;
    }
    return db !== null && db !== undefined && typeof db === 'object';
  } catch (error) {
    console.error('❌ Error checking Firestore initialization:', error);
    return false;
  }
};

// Helper function to get db with error checking
export const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
  }
  return db;
};
