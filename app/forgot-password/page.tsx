"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { forgotPassword } from "@/lib/auth";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail()) {
      return;
    }

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check");
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email, captchaToken ?? undefined);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("An unexpected error occurred");
        } finally {
      setIsLoading(false);
      // Each token works only once, so get a fresh one
      setCaptchaReset((n) => n + 1);
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
              <CardTitle className="text-2xl sm:text-3xl">Reset Password</CardTitle>
              <CardDescription className="text-base">
                {success
                  ? "Check your email for reset instructions"
                  : "Enter your email to reset your password"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Alert */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <Turnstile onToken={setCaptchaToken} resetSignal={captchaReset} />

                  {/* Submit Button */}                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="bg-primary/10 rounded-2xl p-6 text-center">
                    <Mail className="w-12 h-12 text-gold mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-2">
                      Check your inbox
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to{" "}
                      <span className="font-medium">{email}</span>
                    </p>
                  </div>

                  {/* Back to Sign In */}
                  <Link
                    href="/signin"
                    className="block w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground font-medium text-center transition-colors"
                  >
                    <ArrowLeft className="inline mr-2 h-5 w-5" />
                    Back to Sign In
                  </Link>
                </div>
              )}

              {/* Sign In Link */}
              {!success && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/signin" className="text-gold hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              )}
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
