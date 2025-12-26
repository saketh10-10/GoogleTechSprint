"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validateStudentRollNumber,
  validateFacultyEmail,
  validatePassword,
} from "@/lib/auth-validation";
import { authenticateUser } from "@/lib/auth-service";

type LoginType = "student" | "faculty";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>("student");
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // Error messages
  const [rollNumberError, setRollNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const clearErrors = () => {
    setRollNumberError("");
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  const handleStudentLogin = async (e: FormEvent) => {
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

    setIsLoading(true);

    // Attempt authentication (with automatic signup fallback)
    console.log("🔄 Attempting student login with roll number:", rollNumber);
    const result = await authenticateUser(rollNumber, password);
    console.log("📋 Student login result:", result);

    if (result.success && result.user) {
      // Store user role and data in localStorage for later use
      const userRole = result.role || "student";
      localStorage.setItem("userType", userRole);
      localStorage.setItem("rollNumber", rollNumber);
      localStorage.setItem("userRole", userRole);

      // Redirect to homepage (logged-in view)
      router.push("/");
    } else {
      // Show error message for authentication failures
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ Student authentication failed:", result.error);
      }
      setGeneralError(result.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleFacultyLogin = async (e: FormEvent) => {
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

    setIsLoading(true);

    // Attempt authentication (with automatic signup fallback)
    console.log("🔄 Attempting faculty login with email:", email);
    const result = await authenticateUser(email, password);
    console.log("📋 Faculty login result:", result);

    if (result.success && result.user) {
      // Store user role and data in localStorage for later use
      const userRole = result.role || "faculty";
      localStorage.setItem("userType", userRole);
      localStorage.setItem("email", email);
      localStorage.setItem("userRole", userRole);

      // Redirect to homepage (logged-in view)
      router.push("/");
    } else {
      // Show error message for authentication failures
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ Faculty authentication failed:", result.error);
      }
      setGeneralError(result.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (type: LoginType) => {
    setLoginType(type);
    clearErrors();
    setRollNumber("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-2xl">
        {/* Glowing Card Container */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30"></div>

          {/* Main Card */}
          <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl shadow-2xl p-12">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-white">
                  Sign up & verify
                </h1>
                <p className="text-lg text-gray-400">
                  Sign up and complete identity verification to earn a random
                  reward.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-3 p-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                <button
                  type="button"
                  onClick={() => handleTabSwitch("student")}
                  className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all text-lg tracking-wide ${
                    loginType === "student"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("faculty")}
                  className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all text-lg tracking-wide ${
                    loginType === "faculty"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Faculty
                </button>
              </div>

              {/* Student Login Form */}
              {loginType === "student" && (
                <form onSubmit={handleStudentLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      id="rollNumber"
                      type="text"
                      placeholder="Enter your roll number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className={`bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-14 text-lg ${
                        rollNumberError ? "border-red-500" : ""
                      }`}
                      disabled={isLoading}
                      maxLength={10}
                    />
                    {rollNumberError && (
                      <p className="text-sm text-red-400">{rollNumberError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="student-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 h-14 text-lg ${
                          passwordError ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-400">{passwordError}</p>
                    )}
                  </div>

                  {/* Keep me signed in & Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="keepSignedIn"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-700 bg-gray-900/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <label
                        htmlFor="keepSignedIn"
                        className="text-base text-gray-300"
                      >
                        Keep me signed in
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-base text-gray-300 hover:text-white"
                      onClick={() => {
                        /* TODO: Implement forgot password */
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {generalError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-base text-red-400">{generalError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-14 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              )}

              {/* Faculty Login Form */}
              {loginType === "faculty" && (
                <form onSubmit={handleFacultyLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-14 text-lg ${
                        emailError ? "border-red-500" : ""
                      }`}
                      disabled={isLoading}
                    />
                    {emailError && (
                      <p className="text-sm text-red-400">{emailError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="faculty-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 h-14 text-lg ${
                          passwordError ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-400">{passwordError}</p>
                    )}
                  </div>

                  {/* Keep me signed in & Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="keepSignedInFaculty"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-700 bg-gray-900/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <label
                        htmlFor="keepSignedInFaculty"
                        className="text-lg text-gray-300"
                      >
                        Keep me signed in
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-lg text-gray-300 hover:text-white"
                      onClick={() => {
                        /* TODO: Implement forgot password */
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {generalError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-base text-red-400">{generalError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-14 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              )}

              {/* Sign Up Link */}
              <div className="text-center text-lg">
                \n{" "}
                <span className="text-gray-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="text-white hover:text-blue-400 font-medium"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
