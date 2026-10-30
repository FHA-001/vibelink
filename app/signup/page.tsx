"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { signUp, getUserProfile } from "@/lib/auth";
import { getSafeRedirectWithFallback } from "@/lib/redirect";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectWithFallback(redirect, '/my-card');
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acknowledged, setAcknowledged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

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

    if (!acknowledged) {
      newErrors.acknowledgement = "You must agree to the Terms of Service and acknowledge the Privacy Policy";
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

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setAuthError("Please complete the security check");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, safeRedirect, captchaToken ?? undefined);

      if (result.success && result.user) {
        // Check if user has an active session (email confirmation not required)
        const supabase = (await import('@/lib/supabse')).createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User has active session, check profile completion
          const profile = await getUserProfile(result.user.id);
          
          if (profile) {
            // User has completed profile, redirect to validated destination
            router.push(safeRedirect);
          } else {
            // User needs to complete profile, preserve redirect
            router.push(`/complete-profile?redirect=${encodeURIComponent(safeRedirect)}`);
          }
        } else {
          // Email confirmation required - show message
          setAuthError("Please check your email to confirm your account. You'll be redirected to your intended destination after confirmation.");
        }
      } else {
        setAuthError(result.error || "Sign up failed");
      }
    } catch (error) {
      setAuthError("An unexpected error occurred");
        } finally {
      setIsLoading(false);
      // Each token works only once, so get a fresh one
      setCaptchaReset((n) => n + 1);
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

  return (
    <div className="page-canvas min-h-screen flex flex-col">
      {/* Navigation */}
      <nav aria-label="Site" className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">Create your account</CardTitle>
              <CardDescription className="text-base">
                Join VibeLink and start building connections you will remember.
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
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
                      className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-navy"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
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
                      autoComplete="new-password"
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
                      className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-navy"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirm-password-error" className="text-sm text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Acknowledgement Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acknowledgement"
                      checked={acknowledged}
                      onChange={(e) => {
                        setAcknowledged(e.target.checked);
                        if (errors.acknowledgement) {
                          setErrors((prev) => ({ ...prev, acknowledgement: "" }));
                        }
                      }}
                      disabled={isLoading}
                      className="mt-1 w-4 h-4 rounded border-border text-gold focus:ring-primary"
                      aria-invalid={!!errors.acknowledgement}
                      aria-describedby={errors.acknowledgement ? "acknowledgement-error" : undefined}
                    />
                    <label
                      htmlFor="acknowledgement"
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-gold hover:underline">
                        Terms of Service
                      </Link>
                      {" "}
                      and acknowledge the{" "}
                      <Link href="/privacy" className="text-gold hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.acknowledgement && (
                    <p id="acknowledgement-error" className="text-sm text-destructive">
                      {errors.acknowledgement}
                    </p>
                  )}
                </div>

                <Turnstile onToken={setCaptchaToken} resetSignal={captchaReset} />

                {/* Submit Button */}                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href={redirect ? `/signin?redirect=${encodeURIComponent(redirect)}` : "/signin"} 
                  className="text-gold hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-gold transition-colors">
          Back to home
        </Link>
      </footer>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>}>
      <SignUpContent />
    </Suspense>
  );
}