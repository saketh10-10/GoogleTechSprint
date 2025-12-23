// Firebase Authentication Module (v9+ modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIGURATION
// Replace with your actual Firebase project credentials
// Get them from: Firebase Console > Project Settings > Your apps
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCRPtDpV7gTzQN0gQKZqZTN4wjps-zgXnU",
  authDomain: "edusync-eaa2b.firebaseapp.com",
  projectId: "edusync-eaa2b",
  storageBucket: "edusync-eaa2b.firebasestorage.app",
  messagingSenderId: "252728058530",
  appId: "1:252728058530:web:96018ca65912c6c6a2adfb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validates KLH Student Roll Number
 * Patterns: 2410030XXX, 2410040XXX, 2410080XXX
 */
function validateStudentRollNumber(rollNumber) {
  const rollNumberRegex = /^(2410030|2410040|2410080)\d{3}$/;

  if (!rollNumber) {
    return { valid: false, error: "Roll number is required." };
  }

  if (!rollNumberRegex.test(rollNumber)) {
    return {
      valid: false,
      error: "Invalid Roll Number. Please enter a valid KLH roll number.",
    };
  }

  return { valid: true };
}

/**
 * Validates KLH Faculty Email
 * Only allows emails ending with @klh.edu.in
 */
function validateFacultyEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@klh\.edu\.in$/;

  if (!email) {
    return { valid: false, error: "Email is required." };
  }

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: "Only KLH faculty emails (@klh.edu.in) are allowed.",
    };
  }

  return { valid: true };
}

/**
 * Validates password
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: "Password is required." };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  return { valid: true };
}

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with these credentials.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Invalid email format.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/invalid-credential":
      return "Invalid credentials. Please check your roll number/email and password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "An error occurred during authentication. Please try again.";
  }
}

/**
 * Sign in student with roll number
 */
async function signInStudent(rollNumber, password) {
  try {
    // Convert roll number to email format for Firebase
    const email = `${rollNumber}@klh.student`;
    console.log("Attempting student login with email:", email);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Authentication successful, checking Firestore profile...");

    // Check user role in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
      console.error(
        "User profile not found in Firestore for UID:",
        userCredential.user.uid
      );
      await auth.signOut();
      return {
        success: false,
        error: "User profile not found. Please contact administrator.",
      };
    }

    const userData = userDoc.data();
    console.log("User data:", userData);

    if (userData.role !== "student") {
      console.error("Invalid role for student login:", userData.role);
      await auth.signOut();
      return {
        success: false,
        error: "This account is not registered as a student.",
      };
    }

    console.log("Student login successful!");
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Student login error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
}

/**
 * Sign in faculty with email
 */
async function signInFaculty(email, password) {
  try {
    console.log("Attempting faculty login with email:", email);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Authentication successful, checking Firestore profile...");

    // Check user role in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
      console.error(
        "User profile not found in Firestore for UID:",
        userCredential.user.uid
      );
      await auth.signOut();
      return {
        success: false,
        error: "User profile not found. Please contact administrator.",
      };
    }

    const userData = userDoc.data();
    console.log("User data:", userData);

    if (!["faculty", "admin"].includes(userData.role)) {
      console.error("Invalid role for faculty login:", userData.role);
      await auth.signOut();
      return {
        success: false,
        error: "This account does not have faculty or admin access.",
      };
    }

    console.log("Faculty login successful!");
    return {
      success: true,
      user: userCredential.user,
      role: userData.role,
    };
  } catch (error) {
    console.error("Faculty login error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
}

// ============================================================
// UI HELPER FUNCTIONS
// ============================================================

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;

    // If it's an error banner, show it
    if (element.classList.contains("error-banner")) {
      element.classList.add("show");
    }

    // Add error class to input if applicable
    const inputId = elementId.replace("Error", "");
    const input = document.getElementById(inputId);
    if (input) {
      input.classList.add("error");
    }
  }
}

function clearErrors(formType) {
  const prefix = formType === "student" ? "student" : "faculty";

  // Clear all error messages
  const errorElements = document.querySelectorAll(
    `#${formType}Form .error-message`
  );
  errorElements.forEach((el) => (el.textContent = ""));

  // Clear error banner
  const errorBanner = document.getElementById(`${prefix}GeneralError`);
  if (errorBanner) {
    errorBanner.classList.remove("show");
    errorBanner.textContent = "";
  }

  // Remove error class from inputs
  const inputs = document.querySelectorAll(`#${formType}Form input`);
  inputs.forEach((input) => input.classList.remove("error"));
}

function setLoading(formType, loading) {
  const submitBtn = document.getElementById(`${formType}SubmitBtn`);
  const inputs = document.querySelectorAll(`#${formType}Form input`);

  if (loading) {
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.textContent = "Signing in...";
    inputs.forEach((input) => (input.disabled = true));
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = "Sign In";
    inputs.forEach((input) => (input.disabled = false));
  }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

// Tab Switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    // Update tab buttons
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update forms
    document
      .querySelectorAll(".login-form")
      .forEach((form) => form.classList.remove("active"));
    document.getElementById(`${tab}Form`).classList.add("active");

    // Clear all errors
    clearErrors("student");
    clearErrors("faculty");
  });
});

// Student Form Submission
document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors("student");

  const rollNumber = document.getElementById("rollNumber").value.trim();
  const password = document.getElementById("studentPassword").value;

  // Validate roll number
  const rollNumberValidation = validateStudentRollNumber(rollNumber);
  if (!rollNumberValidation.valid) {
    showError("rollNumberError", rollNumberValidation.error);
    return;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showError("studentPasswordError", passwordValidation.error);
    return;
  }

  // Set loading state
  setLoading("student", true);

  // Attempt authentication
  const result = await signInStudent(rollNumber, password);

  if (result.success) {
    // Store user type
    localStorage.setItem("userType", "student");
    localStorage.setItem("rollNumber", rollNumber);

    // Redirect to student dashboard
    window.location.href = "../issuehub/page.html";
  } else {
    showError("studentGeneralError", result.error);
    setLoading("student", false);
  }
});

// Faculty Form Submission
document.getElementById("facultyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors("faculty");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("facultyPassword").value;

  // Validate email
  const emailValidation = validateFacultyEmail(email);
  if (!emailValidation.valid) {
    showError("emailError", emailValidation.error);
    return;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showError("facultyPasswordError", passwordValidation.error);
    return;
  }

  // Set loading state
  setLoading("faculty", true);

  // Attempt authentication
  const result = await signInFaculty(email, password);

  if (result.success) {
    // Store user type
    localStorage.setItem("userType", "faculty");
    localStorage.setItem("email", email);

    // Redirect to faculty dashboard (RoomSync)
    window.location.href = "../roomsync/dashboard.html";
  } else {
    showError("facultyGeneralError", result.error);
    setLoading("faculty", false);
  }
});

// Real-time validation on input change
document.getElementById("rollNumber").addEventListener("input", (e) => {
  const rollNumberError = document.getElementById("rollNumberError");
  if (rollNumberError.textContent) {
    clearErrors("student");
  }
});

document.getElementById("email").addEventListener("input", (e) => {
  const emailError = document.getElementById("emailError");
  if (emailError.textContent) {
    clearErrors("faculty");
  }
});

document.getElementById("studentPassword").addEventListener("input", (e) => {
  const passwordError = document.getElementById("studentPasswordError");
  if (passwordError.textContent) {
    clearErrors("student");
  }
});

document.getElementById("facultyPassword").addEventListener("input", (e) => {
  const passwordError = document.getElementById("facultyPasswordError");
  if (passwordError.textContent) {
    clearErrors("faculty");
  }
});
