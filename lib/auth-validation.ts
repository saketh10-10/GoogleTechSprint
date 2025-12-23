// Authentication Validation Utilities

/**
 * Validates KLH Student Roll Number
 * Accepts patterns: 2410030XXX, 2410040XXX, 2410080XXX
 * Where XXX can be any digit from 0-9
 */
export const validateStudentRollNumber = (rollNumber: string): { valid: boolean; error?: string } => {
  const rollNumberRegex = /^(2410030|2410040|2410080)\d{3}$/;
  
  if (!rollNumber) {
    return { valid: false, error: "Roll number is required." };
  }
  
  if (!rollNumberRegex.test(rollNumber)) {
    return { valid: false, error: "Invalid Roll Number. Please enter a valid KLH roll number." };
  }
  
  return { valid: true };
};

/**
 * Validates KLH Faculty Email
 * Only allows emails ending with @klh.edu.in
 */
export const validateFacultyEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@klh\.edu\.in$/;
  
  if (!email) {
    return { valid: false, error: "Email is required." };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Only KLH faculty emails (@klh.edu.in) are allowed." };
  }
  
  return { valid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: "Password is required." };
  }
  
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long." };
  }
  
  return { valid: true };
};
