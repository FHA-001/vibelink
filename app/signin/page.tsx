"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { signIn, getUserProfile } from "@/lib/auth";
import { getSafeRedirectWithFallback } from "@/lib/redirect";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectWithFallback(redirect, '/my-card');
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  // Prefill email from query parameter if present
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const result = await signIn(formData.email, formData.password, captchaToken ?? undefined);
      if (result.success && result.user) {
        // Check if user has already completed their profile
        const profile = await getUserProfile(result.user.id);
        
        if (profile) {
          // User has completed profile, redirect to validated destination
          router.push(safeRedirect);
        } else {
          // User needs to complete profile, preserve redirect
          router.push(`/complete-profile?redirect=${encodeURIComponent(safeRedirect)}`);
        }
      } else {
        setAuthError(result.error || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError(error instanceof Error ? error.message : "An unexpected error occurred");
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
              <CardTitle className="text-2xl sm:text-3xl">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Sign in to pick up where you left off.
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-gold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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

                <Turnstile onToken={setCaptchaToken} resetSignal={captchaReset} />

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                New to VibeLink?{" "}
                <Link 
                  href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"} 
                  className="text-gold hover:underline font-medium"
                >
                  Create an account
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>}>
      <SignInContent />
    </Suspense>
  );
}