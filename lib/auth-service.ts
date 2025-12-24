// Authentication Service
// IMPORTANT: This service provides CLEAR SEPARATION between:
// - SIGNUP: Creating new user accounts (createUserWithEmailAndPassword)
// - LOGIN: Authenticating existing users (signInWithEmailAndPassword)

// Development mode check - use mock auth if Firebase is not properly configured
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'AIzaSyDemoKeyForDevelopmentPurposesOnly' &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'YOUR_API_KEY_HERE';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Mock user data for development
const MOCK_USERS = {
  '2410030001@klh.student': { password: 'Student@123', name: 'Student One', rollNumber: '2410030001', role: 'student' },
  'faculty@klh.edu.in': { password: 'Faculty@123', name: 'Faculty Member', email: 'faculty@klh.edu.in', role: 'faculty' }
};

// Stable mock user objects to prevent infinite re-renders
const MOCK_USER_OBJECTS = {
  student: {
    uid: 'mock-student-uid',
    email: '2410030001@klh.student',
    displayName: 'Student One'
  },
  faculty: {
    uid: 'mock-faculty-uid',
    email: 'faculty@klh.edu.in',
    displayName: 'Faculty Member'
  }
};

// Mock Firebase Error class for development
class MockFirebaseError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirebaseError';
  }
}

// Mock authentication functions for development
const mockSignInWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential> => {
  const userData = MOCK_USERS[email as keyof typeof MOCK_USERS];
  if (!userData) {
    throw new MockFirebaseError('auth/user-not-found', 'There is no user record corresponding to this identifier.');
  }
  if (userData.password !== password) {
    throw new MockFirebaseError('auth/wrong-password', 'The password is invalid or the user does not have a password.');
  }

  // Return appropriate mock user based on role
  const mockUser = userData.role === 'student' ? MOCK_USER_OBJECTS.student : MOCK_USER_OBJECTS.faculty;

  return {
    user: mockUser as any,
    providerId: null,
    operationType: 'signIn'
  };
};

const mockCreateUserWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential> => {
  // For demo purposes, allow signup but don't actually store
  // Determine role based on email domain
  const role = email.endsWith('@klh.edu.in') ? 'faculty' : 'student';
  const mockUser = role === 'student' ? MOCK_USER_OBJECTS.student : MOCK_USER_OBJECTS.faculty;

  return {
    user: mockUser as any,
    providerId: '',
    operationType: 'signIn'
  };
};

const mockSignOut = async (): Promise<void> => {
  // Mock sign out - do nothing
  return Promise.resolve();
};

// Mock Firestore functions for development
const mockSetDoc = async (docRef: any, data: any): Promise<void> => {
  // Mock setDoc - just log the operation
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 MOCK FIRESTORE: Saving user data', data);
  }
  return Promise.resolve();
};

const mockGetDoc = async (docRef: any): Promise<any> => {
  // Mock getDoc - return mock user data
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 MOCK FIRESTORE: Fetching user data');
  }

  // For mock authentication, we don't have persistent user data
  // Return a basic user structure
  const mockUserData = {
    uid: 'mock-uid',
    email: 'mock@example.com',
    role: 'student', // default role
    rollNumber: null,
    createdAt: new Date(),
    isActive: true
  };

  return {
    exists: () => true,
    data: () => mockUserData
  };
};

export type UserType = 'student' | 'faculty';

export interface AuthResult {
  success: boolean;
  user?: User;
  role?: 'student' | 'faculty';
  error?: string;
  message?: string; // User-friendly message
}

/**
 * STUDENT LOGIN: Authenticate existing student account
 * Roll number is converted to email format for Firebase: rollnumber@klh.student
 */
export const signInStudent = async (rollNumber: string, password: string): Promise<AuthResult> => {
  // Input validation
  if (!rollNumber?.trim() || !password?.trim()) {
    return {
      success: false,
      error: 'auth/invalid-input',
      message: 'Please enter both roll number and password.'
    };
  }

  try {
    // Convert roll number to email format for Firebase
    const email = `${rollNumber.trim()}@klh.student`;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 STUDENT LOGIN: Attempting authentication for', email);
    }

    const userCredential: UserCredential = isFirebaseConfigured
      ? await signInWithEmailAndPassword(auth, email, password)
      : await mockSignInWithEmailAndPassword(email, password);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ STUDENT LOGIN SUCCESS: User authenticated', userCredential.user.uid);
    }
    return {
      success: true,
      user: userCredential.user,
      message: 'Student login successful!'
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ STUDENT LOGIN ERROR:', error?.code, error?.message);
    }
    const errorMessage = getAuthErrorMessage(error?.code);
    return {
      success: false,
      error: error?.code || 'unknown-error',
      message: errorMessage
    };
  }
};

/**
 * FACULTY LOGIN: Authenticate existing faculty account
 */
export const signInFaculty = async (email: string, password: string): Promise<AuthResult> => {
  // Input validation
  if (!email?.trim() || !password?.trim()) {
    return {
      success: false,
      error: 'auth/invalid-input',
      message: 'Please enter both email and password.'
    };
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 FACULTY LOGIN: Attempting authentication for', email.trim());
    }

    const userCredential: UserCredential = isFirebaseConfigured
      ? await signInWithEmailAndPassword(auth, email.trim(), password)
      : await mockSignInWithEmailAndPassword(email.trim(), password);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ FACULTY LOGIN SUCCESS: User authenticated', userCredential.user.uid);
    }
    return {
      success: true,
      user: userCredential.user,
      message: 'Faculty login successful!'
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ FACULTY LOGIN ERROR:', error?.code, error?.message);
    }
    const errorMessage = getAuthErrorMessage(error?.code);
    return {
      success: false,
      error: error?.code || 'unknown-error',
      message: errorMessage
    };
  }
};

/**
 * REQUIRED AUTH FLOW: Login with automatic signup fallback
 *
 * 1. Attempt login first: signInWithEmailAndPassword(auth, email, password)
 * 2. If login succeeds: Fetch user role from database, redirect to dashboard
 * 3. If login fails with auth/user-not-found OR auth/invalid-credential (new user case):
 *    - Call createUserWithEmailAndPassword(auth, email, password)
 *    - Confirm user created successfully
 *    - Save user document in database (uid, email, role, createdAt)
 *    - DO NOT attempt login again (Firebase auto-authenticates after signup)
 *    - Redirect to correct dashboard
 * 4. If login fails with auth/wrong-password, auth/too-many-requests, auth/invalid-email:
 *    - Show error message
 *    - DO NOT attempt signup
 *
 * @param identifier - Email address or roll number
 * @param password - Account password
 * @returns AuthResult with success status and user data or error message
 */
export const authenticateUser = async (identifier: string, password: string): Promise<AuthResult> => {
  // Input validation
  if (!identifier?.trim() || !password?.trim()) {
    return {
      success: false,
      error: 'auth/invalid-input',
      message: 'Please enter both email/roll number and password.'
    };
  }

  const trimmedIdentifier = identifier.trim();

  try {
    // Determine user type and construct email based on identifier format
    let email: string;
    let userType: 'student' | 'faculty';

    if (trimmedIdentifier.includes('@')) {
      // It's an email address
      email = trimmedIdentifier;
      if (email.endsWith('@klh.edu.in')) {
        userType = 'faculty';
      } else {
        return {
          success: false,
          error: 'auth/invalid-email',
          message: 'Please use a valid KLH email address.'
        };
      }
    } else {
      // It's a roll number - convert to student email
      email = `${trimmedIdentifier}@klh.student`;
      userType = 'student';
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 ${userType.toUpperCase()} AUTH: Attempting authentication for`, email);
      console.log(`🔍 Using ${isFirebaseConfigured ? 'Firebase' : 'Mock'} authentication`);
    }

    // 1. Attempt login first: signInWithEmailAndPassword(auth, email, password)
    try {
      const userCredential: UserCredential = isFirebaseConfigured
        ? await signInWithEmailAndPassword(auth, email, password)
        : await mockSignInWithEmailAndPassword(email, password);

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${userType.toUpperCase()} LOGIN SUCCESS: User authenticated`, userCredential.user.uid);
      }

      // 2. If login succeeds: Fetch user role from database, redirect to dashboard
      try {
        const userDoc = isFirebaseConfigured
          ? await getDoc(doc(db, 'users', userCredential.user.uid))
          : await mockGetDoc(null);

        let userRole = userType; // fallback to determined type
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRole = userData?.role || userType;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`📋 USER ROLE FETCHED: ${userRole} for user ${userCredential.user.uid}`);
        }

        return {
          success: true,
          user: userCredential.user,
          role: userRole,
          message: `${userRole === 'student' ? 'Student' : 'Faculty'} login successful!`
        };
      } catch (fetchError: any) {
        // If we can't fetch user data, still allow login with determined role
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Could not fetch user data, using determined role: ${userType}`, fetchError?.message);
        }

        return {
          success: true,
          user: userCredential.user,
          role: userType,
          message: `${userType === 'student' ? 'Student' : 'Faculty'} login successful!`
        };
      }
    } catch (loginError: any) {
      // 3. If login fails with auth/user-not-found OR auth/invalid-credential (new user case)
      if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 ${userType.toUpperCase()} NOT FOUND: Creating new account for`, email);
        }

        // Call createUserWithEmailAndPassword - Firebase auto-authenticates after signup
        try {
          const userCredential: UserCredential = isFirebaseConfigured
            ? await createUserWithEmailAndPassword(auth, email, password)
            : await mockCreateUserWithEmailAndPassword(email, password);

          // Save user document in database with required fields
          if (isFirebaseConfigured) {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: email,
              role: userType,
              rollNumber: userType === 'student' ? trimmedIdentifier : null,
              createdAt: new Date(),
              isActive: true
            });
          } else {
            await mockSetDoc(null, {
              uid: userCredential.user.uid,
              email: email,
              role: userType,
              rollNumber: userType === 'student' ? trimmedIdentifier : null,
              createdAt: new Date(),
              isActive: true
            });
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ${userType.toUpperCase()} ACCOUNT CREATED:`, userCredential.user.uid);
          }

          return {
            success: true,
            user: userCredential.user,
            role: userType,
            message: `${userType === 'student' ? 'Student' : 'Faculty'} account created successfully!`
          };
        } catch (signupError: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ ${userType.toUpperCase()} SIGNUP ERROR:`, signupError?.code, signupError?.message);
          }
          const errorMessage = getAuthErrorMessage(signupError?.code);
          return {
            success: false,
            error: signupError?.code || 'unknown-error',
            message: errorMessage
          };
        }
      } else {
        // 4. If login fails with auth/wrong-password, auth/too-many-requests, auth/invalid-email
        // Show error message - DO NOT attempt signup
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ ${userType.toUpperCase()} LOGIN ERROR:`, loginError?.code, loginError?.message);
        }
        const errorMessage = getAuthErrorMessage(loginError?.code);
        return {
          success: false,
          error: loginError?.code || 'unknown-error',
          message: errorMessage
        };
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ AUTHENTICATION ERROR:', error?.code, error?.message);
    }
    const errorMessage = getAuthErrorMessage(error?.code);
    return {
      success: false,
      error: error?.code || 'unknown-error',
      message: errorMessage
    };
  }
};


/**
 * STUDENT SIGNUP: Create new student account
 * ONLY use this to create NEW student accounts
 * This will FAIL if the student account already exists
 *
 * @param rollNumber - Student roll number (e.g., "2410030001")
 * @param password - Desired password (must be strong)
 * @returns AuthResult with success status and user data or error message
 */
export const registerStudent = async (rollNumber: string, password: string): Promise<AuthResult> => {
  // Input validation
  if (!rollNumber?.trim()) {
    return {
      success: false,
      error: 'auth/invalid-input',
      message: 'Please enter a valid roll number.'
    };
  }

  if (!password?.trim() || password.length < 6) {
    return {
      success: false,
      error: 'auth/weak-password',
      message: 'Password must be at least 6 characters long.'
    };
  }

  try {
    // Convert roll number to email format for Firebase
    const email = `${rollNumber.trim()}@klh.student`;
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 STUDENT SIGNUP: Creating new account for', email);
    }

    const userCredential: UserCredential = isFirebaseConfigured
      ? await createUserWithEmailAndPassword(auth, email, password)
      : await mockCreateUserWithEmailAndPassword(email, password);

    // Save user role to Firestore
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'student',
        rollNumber: rollNumber.trim(),
        createdAt: new Date(),
        isActive: true
      });
    } else {
      await mockSetDoc(null, {
        email: email,
        role: 'student',
        rollNumber: rollNumber.trim(),
        createdAt: new Date(),
        isActive: true
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ STUDENT SIGNUP SUCCESS: New account created', userCredential.user.uid);
    }
    return {
      success: true,
      user: userCredential.user,
      message: 'Student account created successfully!'
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ STUDENT SIGNUP ERROR:', error?.code, error?.message);
    }
    const errorMessage = getAuthErrorMessage(error?.code);
    return {
      success: false,
      error: error?.code || 'unknown-error',
      message: errorMessage
    };
  }
};

/**
 * FACULTY SIGNUP: Create new faculty account
 * ONLY use this to create NEW faculty accounts
 * This will FAIL if the faculty account already exists
 *
 * @param email - Faculty email address
 * @param password - Desired password (must be strong)
 * @returns AuthResult with success status and user data or error message
 */
export const registerFaculty = async (email: string, password: string): Promise<AuthResult> => {
  // Input validation
  if (!email?.trim()) {
    return {
      success: false,
      error: 'auth/invalid-input',
      message: 'Please enter a valid email address.'
    };
  }

  if (!password?.trim() || password.length < 6) {
    return {
      success: false,
      error: 'auth/weak-password',
      message: 'Password must be at least 6 characters long.'
    };
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 FACULTY SIGNUP: Creating new account for', email.trim());
    }

    const userCredential: UserCredential = isFirebaseConfigured
      ? await createUserWithEmailAndPassword(auth, email.trim(), password)
      : await mockCreateUserWithEmailAndPassword(email.trim(), password);

    // Save user role to Firestore
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email.trim(),
        role: 'faculty',
        createdAt: new Date(),
        isActive: true
      });
    } else {
      await mockSetDoc(null, {
        email: email.trim(),
        role: 'faculty',
        createdAt: new Date(),
        isActive: true
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ FACULTY SIGNUP SUCCESS: New account created', userCredential.user.uid);
    }
    return {
      success: true,
      user: userCredential.user,
      message: 'Faculty account created successfully!'
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ FACULTY SIGNUP ERROR:', error?.code, error?.message);
    }
    const errorMessage = getAuthErrorMessage(error?.code);
    return {
      success: false,
      error: error?.code || 'unknown-error',
      message: errorMessage
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  if (isFirebaseConfigured) {
    await firebaseSignOut(auth);
  } else {
    await mockSignOut();
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  // Check if we're on the client side (browser environment)
  if (typeof window === 'undefined') {
    // Server-side: cannot access localStorage, return null
    return null;
  }

  // Check if Firebase is properly configured
  if (isFirebaseConfigured) {
    return auth.currentUser;
  } else {
    // For mock authentication, check if user is logged in via localStorage
    try {
      const role = localStorage.getItem('userRole') || localStorage.getItem('userType');

      if (role) {
        // Return stable mock user object to prevent infinite re-renders
        return role === 'student' ? MOCK_USER_OBJECTS.student as any : MOCK_USER_OBJECTS.faculty as any;
      }
    } catch (error) {
      // localStorage might not be available in some environments
      console.warn('localStorage not available:', error);
    }

    return null;
  }
};

/**
 * Convert Firebase error codes to user-friendly messages
 * Provides specific guidance for signup vs login scenarios
 */
const getAuthErrorMessage = (errorCode?: string): string => {
  // Handle undefined/null error codes
  if (!errorCode) {
    return 'An unexpected error occurred. Please try again.';
  }
  switch (errorCode) {
    // SIGNUP SPECIFIC ERRORS (when creating accounts)
    case 'auth/email-already-in-use':
      return 'Account already exists. Please use the login form instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';

    // LOGIN SPECIFIC ERRORS (when authenticating existing accounts)
    case 'auth/user-not-found':
      return 'Account does not exist. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Account not found or invalid credentials. Please sign up if you don\'t have an account.';

    // GENERAL ERRORS
    case 'auth/invalid-email':
      return 'Invalid email format. Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/invalid-input':
      return 'Please fill in all required fields.';

    // FALLBACK
    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unhandled Firebase Auth error code:', errorCode);
      }
      return 'An unexpected error occurred. Please try again or contact support.';
  }
};
