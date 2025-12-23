"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { signInStudent, signInFaculty } from "@/lib/auth-service";

type LoginType = "student" | "faculty";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>("student");
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    // Attempt Firebase authentication
    const result = await signInStudent(rollNumber, password);

    if (result.success) {
      // Store user type in localStorage for later use
      localStorage.setItem("userType", "student");
      localStorage.setItem("rollNumber", rollNumber);

      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      setGeneralError(result.error || "Login failed");
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

    // Attempt Firebase authentication
    const result = await signInFaculty(email, password);

    if (result.success) {
      // Store user type in localStorage for later use
      localStorage.setItem("userType", "faculty");
      localStorage.setItem("email", email);

      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      setGeneralError(result.error || "Login failed");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            KLH Login Portal
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => handleTabSwitch("student")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                loginType === "student"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("faculty")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                loginType === "faculty"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Faculty Login
            </button>
          </div>

          {/* Student Login Form */}
          {loginType === "student" && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="2410030XXX"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className={rollNumberError ? "border-red-500" : ""}
                  disabled={isLoading}
                  maxLength={10}
                />
                {rollNumberError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {rollNumberError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={passwordError ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {passwordError}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Faculty Login Form */}
          {loginType === "faculty" && (
            <form onSubmit={handleFacultyLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@klh.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty-password">Password</Label>
                <Input
                  id="faculty-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={passwordError ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {passwordError}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
