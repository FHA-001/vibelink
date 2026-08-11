"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { resetPassword, getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabse";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkRecoverySession = async () => {
      try {
        const supabase = createClient();
        
        // Check for recovery tokens in URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Exchange tokens for session (recovery flow)
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error("Session exchange error:", sessionError);
            setAuthError("Invalid or expired reset link. Please request a new password reset.");
            setHasValidSession(false);
            setIsCheckingSession(false);
            return;
          }
        }
        
        // Verify the session is valid
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Session check error:", error);
          setAuthError("Invalid or expired reset link. Please request a new password reset.");
          setHasValidSession(false);
        } else if (user) {
          // User has a valid session (recovery or regular)
          setHasValidSession(true);
        } else {
          // No session - invalid or expired link
          setAuthError("Invalid or expired reset link. Please request a new password reset.");
          setHasValidSession(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setAuthError("Failed to verify reset link. Please try again.");
        setHasValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!validateForm()) {
      return;
    }

    if (!hasValidSession) {
      setAuthError("Invalid or expired reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(formData.password);

      if (result.success) {
        setSuccess(true);
      } else {
        setAuthError(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setAuthError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="p-4 sm:p-6">
          <Link href="/">
            <Logo />
          </Link>
        </nav>
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="p-4 sm:p-6">
          <Link href="/">
            <Logo />
          </Link>
        </nav>
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl sm:text-3xl">Invalid Reset Link</CardTitle>
                <CardDescription className="text-base">
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-destructive/10 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-2">
                    Link Expired or Invalid
                  </p>
                  <p className="text-sm text-foreground/70">
                    {authError || "Please request a new password reset link"}
                  </p>
                </div>

                <Link
                  href="/forgot-password"
                  className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl font-medium text-center transition-colors"
                >
                  Request New Reset Link
                </Link>

                <Link
                  href="/signin"
                  className="block w-full text-center text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="p-4 sm:p-6">
        <Link href="/">
          <Logo />
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">
                {success ? "Password Reset" : "New Password"}
              </CardTitle>
              <CardDescription className="text-base">
                {success
                  ? "Your password has been successfully updated"
                  : "Enter your new password below"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Alert */}
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p id="confirm-password-error" className="text-sm text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="bg-primary/10 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-2">
                      Password Updated Successfully
                    </p>
                    <p className="text-sm text-foreground/70">
                      You can now sign in with your new password
                    </p>
                  </div>

                  {/* Back to Sign In */}
                  <Link
                    href="/signin"
                    className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl font-medium text-center transition-colors"
                  >
                    <ArrowLeft className="inline mr-2 h-5 w-5" />
                    Back to Sign In
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center text-sm text-foreground/50">
        <Link href="/" className="hover:text-primary transition-colors">
          Back to home
        </Link>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
