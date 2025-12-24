// Firebase Configuration and Initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
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

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
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

export { app, auth, db, functions };
