// Authentication Service
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

export type UserType = 'student' | 'faculty';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign in student with roll number and password
 * Roll number is converted to email format for Firebase: rollnumber@klh.student
 */
export const signInStudent = async (rollNumber: string, password: string): Promise<AuthResult> => {
  try {
    // Convert roll number to email format for Firebase
    const email = `${rollNumber}@klh.student`;
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Sign in faculty with email and password
 */
export const signInFaculty = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Register new student (optional - for signup functionality)
 */
export const registerStudent = async (rollNumber: string, password: string): Promise<AuthResult> => {
  try {
    const email = `${rollNumber}@klh.student`;
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Register new faculty (optional - for signup functionality)
 */
export const registerFaculty = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with these credentials.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your roll number/email and password.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
};
