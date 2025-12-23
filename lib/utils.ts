import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, ''); // Only allow valid email characters
}

/**
 * Validate and sanitize roll number input
 */
export function sanitizeRollNumber(rollNumber: string): string {
  if (!rollNumber) return '';

  return rollNumber
    .trim()
    .replace(/\D/g, '') // Only allow digits
    .slice(0, 10); // Max 10 digits
}
