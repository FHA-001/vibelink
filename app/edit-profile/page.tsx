"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, User, Briefcase, MessageSquare, Link as LinkIcon, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { getCurrentUser, getUserProfile, saveUserProfile, isUsernameAvailable, Profile } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    jobTitle: "",
    companySchool: "",
    bio: "",
    interests: "",
    website: "",
    linkedin: "",
    twitter: "",
    github: "",
    instagram: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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

      const userProfile = await getUserProfile(currentUser.id);
      if (!userProfile) {
        // User doesn't have a profile, redirect to complete profile
        router.push("/complete-profile");
        return;
      }

      setUser(currentUser);
      setProfile(userProfile);

      // Pre-populate form with existing profile data
      setFormData({
        username: userProfile.username,
        fullName: userProfile.full_name,
        jobTitle: userProfile.job_title,
        companySchool: userProfile.company_school || "",
        bio: userProfile.bio,
        interests: userProfile.interests?.join(", ") || "",
        website: userProfile.website || "",
        linkedin: userProfile.linkedin || "",
        twitter: userProfile.twitter || "",
        github: userProfile.github || "",
        instagram: userProfile.instagram || "",
      });
    } catch (error) {
      setAuthError("Failed to load profile");
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = "Username must be 3-20 characters (letters, numbers, underscores only)";
    } else if (usernameAvailable === false) {
      newErrors.username = "Username is already taken";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length < 10) {
      newErrors.bio = "Bio must be at least 10 characters";
    } else if (formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please enter a valid URL (https://example.com)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async (username: string) => {
    // Skip availability check if username hasn't changed
    if (profile && username === profile.username) {
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
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
      // Parse interests from comma-separated string
      const interestsArray = formData.interests
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Save the profile data to Supabase
      const result = await saveUserProfile(user.id, {
        username: formData.username,
        full_name: formData.fullName,
        job_title: formData.jobTitle,
        company_school: formData.companySchool,
        bio: formData.bio,
        interests: interestsArray,
        website: formData.website,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        github: formData.github,
        instagram: formData.instagram,
        // Preserve existing profile photo
        profile_photo: profile?.profile_photo,
      });

      if (!result.success) {
        setAuthError(result.error || "Failed to save profile");
        return;
      }

      // Redirect to My Card after successful save
      router.push("/my-card");
    } catch (error) {
      setAuthError("Failed to save profile");
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="p-4 sm:p-6 flex items-center justify-between">
        <Link href="/my-card">
          <Logo />
        </Link>
        <Button
          variant="ghost"
          onClick={() => router.push("/my-card")}
          className="text-foreground/70 hover:text-foreground"
        >
          Cancel
        </Button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
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
                <User className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl sm:text-3xl">Edit Profile</CardTitle>
              <CardDescription className="text-base">
                Update your profile information
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
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isSaving}
                      aria-invalid={!!errors.username}
                      aria-describedby={errors.username ? "username-error" : "username-status"}
                    />
                    {isCheckingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />
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
                      ) : profile && formData.username === profile.username ? (
                        <span className="text-foreground/50">Current username</span>
                      ) : (
                        <span className="text-foreground/50">Checking availability...</span>
                      )}
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

                {/* Job Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    placeholder="Product Designer"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={!!errors.jobTitle}
                    aria-describedby={errors.jobTitle ? "jobtitle-error" : undefined}
                  />
                  {errors.jobTitle && (
                    <p id="jobtitle-error" className="text-sm text-destructive">
                      {errors.jobTitle}
                    </p>
                  )}
                </div>

                {/* Company/School Field */}
                <div className="space-y-2">
                  <Label htmlFor="companySchool" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company / School
                  </Label>
                  <Input
                    id="companySchool"
                    name="companySchool"
                    type="text"
                    placeholder="Company Inc. or University"
                    value={formData.companySchool}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Bio *
                  </Label>
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={isSaving}
                    rows={4}
                    className="flex w-full rounded-2xl border border-border bg-background px-4 py-3 text-base ring-offset-background placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    aria-invalid={!!errors.bio}
                    aria-describedby={errors.bio ? "bio-error" : undefined}
                  />
                  <div className="flex justify-between">
                    {errors.bio && (
                      <p id="bio-error" className="text-sm text-destructive">
                        {errors.bio}
                      </p>
                    )}
                    <p className="text-sm text-foreground/50 ml-auto">
                      {formData.bio.length}/500
                    </p>
                  </div>
                </div>

                {/* Interests Field */}
                <div className="space-y-2">
                  <Label htmlFor="interests" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Interests (comma separated)
                  </Label>
                  <Input
                    id="interests"
                    name="interests"
                    type="text"
                    placeholder="Design, Technology, Music"
                    value={formData.interests}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  <p className="text-sm text-foreground/50">
                    Separate multiple interests with commas
                  </p>
                </div>

                {/* Website Field */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Website (Optional)
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-invalid={!!errors.website}
                    aria-describedby={errors.website ? "website-error" : undefined}
                  />
                  {errors.website && (
                    <p id="website-error" className="text-sm text-destructive">
                      {errors.website}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Social Links (Optional)</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      type="url"
                      placeholder="https://twitter.com/yourhandle"
                      value={formData.twitter}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-sm">GitHub</Label>
                    <Input
                      id="github"
                      name="github"
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={formData.github}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      type="url"
                      placeholder="https://instagram.com/yourusername"
                      value={formData.instagram}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving profile...
                    </>
                  ) : (
                    <>
                      Save Changes
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
      <footer className="p-4 sm:p-6 text-center text-sm text-foreground/50">
        <Link href="/my-card" className="hover:text-primary transition-colors">
          Back to My Card
        </Link>
      </footer>
    </div>
  );
}
