"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  validateStudentRollNumber,
  validateFacultyEmail,
  validatePassword,
} from "@/lib/auth-validation";
import { registerStudent, registerFaculty } from "@/lib/auth-service";

type SignupType = "student" | "faculty";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signupType, setSignupType] = useState<SignupType>("student");

  // Check URL parameters to set initial tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'faculty') {
      setSignupType('faculty');
    } else {
      setSignupType('student');
    }
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error messages
  const [rollNumberError, setRollNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectMessage, setRedirectMessage] = useState("");

  // Check if user was redirected from login page
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setRedirectMessage(`It looks like you don't have a ${tabParam} account yet. Create one below!`);
    }
  }, [searchParams]);

  const clearErrors = () => {
    setRollNumberError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");
    setSuccessMessage("");
  };

  const handleStudentSignup = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validate roll number
    const rollNumberValidation = validateStudentRollNumber(rollNumber);
    if (!rollNumberValidation.valid) {
      setRollNumberError(rollNumberValidation.error || "");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "");
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    // Attempt Firebase account creation
    const result = await registerStudent(rollNumber, password);

    if (result.success) {
      setSuccessMessage("Account created successfully! You can now sign in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setGeneralError(result.message || "Account creation failed");
    }

    setIsLoading(false);
  };

  const handleFacultySignup = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validate email
    const emailValidation = validateFacultyEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || "");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "");
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    // Attempt Firebase account creation
    const result = await registerFaculty(email, password);

    if (result.success) {
      setSuccessMessage("Account created successfully! You can now sign in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setGeneralError(result.message || "Account creation failed");
    }

    setIsLoading(false);
  };

  const handleTabSwitch = (type: SignupType) => {
    setSignupType(type);
    clearErrors();
    setRollNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border backdrop-blur-sm bg-background/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-medium text-foreground tracking-tight"
            >
              AttendAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" className="hover:bg-secondary" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              asChild
            >
              <Link href="/attendai">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/5 mb-8">
            <Sparkles className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-600 font-medium">
              Join KLH Community
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground mb-6 text-balance">
            Create Your Account
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Join the KLH community and access intelligent campus management tools
            designed for students and faculty.
          </p>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2 p-1 bg-muted rounded-full">
              <button
                type="button"
                onClick={() => handleTabSwitch("student")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  signupType === "student"
                    ? "bg-green-600 text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Student Signup
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("faculty")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  signupType === "faculty"
                    ? "bg-green-600 text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Faculty Signup
              </button>
            </div>
          </div>

          {/* Redirect Message */}
          {redirectMessage && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {redirectMessage}
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </p>
            </div>
          )}

          <div className="max-w-md mx-auto">
            {/* Student Signup Form */}
            {signupType === "student" && (
              <form onSubmit={handleStudentSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber" className="text-left block">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    type="text"
                    placeholder="2410030XXX"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className={rollNumberError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                    maxLength={10}
                  />
                  {rollNumberError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {rollNumberError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-password" className="text-left block">Password</Label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-confirm-password" className="text-left block">Confirm Password</Label>
                  <Input
                    id="student-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={confirmPasswordError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {generalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {generalError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Student Account"}
                  {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            )}

            {/* Faculty Signup Form */}
            {signupType === "faculty" && (
              <form onSubmit={handleFacultySignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-left block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@klh.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={emailError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty-password" className="text-left block">Password</Label>
                  <Input
                    id="faculty-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty-confirm-password" className="text-left block">Confirm Password</Label>
                  <Input
                    id="faculty-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={confirmPasswordError ? "border-red-500" : "border-border"}
                    disabled={isLoading}
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-left">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {generalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {generalError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Faculty Account"}
                  {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            )}

            {/* Link to Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 AttendAI. Google TechSprint Project.
          </p>
        </div>
      </footer>
    </div>
  );
}
