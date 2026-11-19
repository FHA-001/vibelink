"use client";

import { useState, useEffect, Suspense } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { verifySignupCode, resendSignupEmail, getUserProfile } from "@/lib/auth";
import { getSafeRedirectWithFallback } from "@/lib/redirect";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const safeRedirect = getSafeRedirectWithFallback(searchParams.get("redirect"), "/my-card");
  const fromSignin = searchParams.get("from") === "signin";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(fromSignin ? 0 : RESEND_SECONDS);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email`);
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifySignupCode(email, code);
      if (result.success && result.user) {
        const profile = await getUserProfile(result.user.id);
        if (profile) {
          router.push(safeRedirect);
        } else {
          router.push(`/complete-profile?redirect=${encodeURIComponent(safeRedirect)}`);
        }
        return;
      }
      setError("That code is wrong or has expired. Check the code or send a new one.");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check");
      return;
    }

    setIsResending(true);
    try {
      const result = await resendSignupEmail(email, safeRedirect, captchaToken ?? undefined);
      if (result.success) {
        setInfo("A new code is on its way. Check your spam folder too.");
        setCooldown(RESEND_SECONDS);
      } else {
        setError(result.error || "Could not send a new code. Try again soon.");
      }
    } finally {
      setIsResending(false);
      setCaptchaReset((n) => n + 1);
    }
  };

  return (
    <div className="page-canvas min-h-screen flex flex-col">
      <nav aria-label="Site" className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
      </nav>

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="size-6 text-gold" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Check your email</CardTitle>
              <CardDescription className="text-base">
                {email
                  ? <>We sent a {OTP_LENGTH}-digit code to <strong>{email}</strong>. It can take a minute. Check spam if you do not see it.</>
                  : "Enter your email on the sign up page to get a code."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!email ? (
                <Button className="w-full" render={<Link href="/signup" />}>
                  Go to sign up
                </Button>
              ) : (
                <form onSubmit={handleVerify} className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {info && (
                    <Alert className="border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400">
                      <AlertDescription>{info}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="code">Confirmation code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      placeholder={"0".repeat(OTP_LENGTH)}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      disabled={isVerifying}
                      className="text-center text-2xl tracking-[0.5em]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      "Confirm email"
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    You can also tap the link in the email instead.
                  </p>

                  <Turnstile onToken={setCaptchaToken} resetSignal={captchaReset} />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isResending}
                  >
                    {isResending
                      ? "Sending..."
                      : cooldown > 0
                        ? `Send a new code in ${cooldown}s`
                        : "Send a new code"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Wrong email?{" "}
                    <Link href="/signup" className="text-gold hover:underline font-medium">
                      Start again
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}