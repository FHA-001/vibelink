"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Share2 } from "lucide-react";
import { getProfileByUsername, Profile, getCurrentUser } from "@/lib/auth";
import { PublicProfilePreview } from "@/components/profile/public-profile-preview";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const userProfile = await getProfileByUsername(username);
      if (!userProfile) {
        setError("Profile not found");
        return;
      }
      setProfile(userProfile);

      // Check if current user is the profile owner
      const currentUser = await getCurrentUser();
      setIsOwner(currentUser?.id === userProfile.id);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name} - VibeLink`,
          text: `Check out ${profile?.full_name}'s VibeLink profile!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Profile link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4">
          <Link href="/">
            <Logo />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-foreground/70 mb-6">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
        <button
          onClick={handleShare}
          className="text-foreground/70 hover:text-foreground"
          aria-label="Share profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isOwner ? (
              // If owner, show full profile (redirect to my-card)
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  This is your profile
                </h2>
                <p className="text-foreground/70 mb-6">
                  View your full profile on your card page
                </p>
                <Link
                  href="/my-card"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-medium transition-colors"
                >
                  Go to My Card
                </Link>
              </div>
            ) : (
              // If visitor, show limited preview with Know More button
              <PublicProfilePreview
                profile={profile}
                isOwner={false}
              />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}