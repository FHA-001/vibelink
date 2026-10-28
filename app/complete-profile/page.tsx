"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { getCurrentUser, signOut, getUserProfile, saveUserProfile, isUsernameAvailable, validateUsername, ProfileVisibility } from "@/lib/auth";
import { getSafeRedirectWithFallback } from "@/lib/redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectWithFallback(redirect, '/my-card');
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // Default visibility configuration for new users
  const defaultVisibility: ProfileVisibility = {
    profile_photo: true,
    full_name: false,
    job_title: true,
    company_school: true,
    bio: true,
    interests: true,
    website: false,
    linkedin: false,
    twitter: false,
    github: false,
    instagram: false,
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      
      // Check if user already has a profile
      const existingProfile = await getUserProfile(currentUser.id);
      if (existingProfile) {
        // User already completed profile, redirect to validated destination
        router.push(safeRedirect);
        return;
      }
      
      setUser(currentUser);
    } catch (error) {
      setAuthError("Failed to check authentication");
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      newErrors.username = usernameError;
    } else if (usernameAvailable === false) {
      newErrors.username = "Username is already taken";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async (username: string) => {
        if (validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Save the profile data to Supabase
      const result = await saveUserProfile(user.id, {
        username: formData.username,
        full_name: formData.fullName,
        profile_visibility: defaultVisibility,
      });

      if (!result.success) {
        setAuthError(result.error || "Failed to save profile");
        return;
      }

      // Redirect to validated destination after successful save
      router.push(safeRedirect);
    } catch (error) {
      setAuthError("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
    // Usernames are always lowercase
    const value = name === "username" ? e.target.value.toLowerCase() : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "username") setUsernameAvailable(null);
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="page-canvas min-h-screen flex flex-col">
      {/* Navigation */}
      <nav aria-label="Site" className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          Sign Out
        </Button>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <Card>
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <User className="w-8 h-8 text-navy" />
              </motion.div>
              <CardTitle className="text-2xl sm:text-3xl">Complete Your Profile</CardTitle>
              <CardDescription className="text-base">
                Just your username and full name to get started. Add more details anytime.
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

                {/* Success Message */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Signed in as {user.email}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username *
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      maxLength={20}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isSaving}
                      aria-invalid={!!errors.username}
                      aria-describedby={errors.username ? "username-error" : "username-status"}
                    />
                    {isCheckingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p id="username-error" className="text-sm text-destructive">
                      {errors.username}
                    </p>
                  )}
                  {!errors.username && formData.username && (
                    <p id="username-status" className="text-sm">
                      {usernameAvailable === true ? (
                        <span className="text-green-600">Username available</span>
                      ) : usernameAvailable === false ? (
                        <span className="text-destructive">Username taken</span>
                      ) : (
                        <span className="text-muted-foreground">{validateUsername(formData.username) ?? "Checking availability..."}</span>                      )}
                    </p>
                  )}
                </div>

                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "fullname-error" : undefined}
                  />
                  {errors.fullName && (
                    <p id="fullname-error" className="text-sm text-destructive">
                      {errors.fullName}
                    </p>
                  )}
                </div>


                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving profile...
                    </>
                  ) : (
                    <>
                      Complete Profile
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
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

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}