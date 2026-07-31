"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Share2, Download, Edit, QrCode } from "lucide-react";
import { getCurrentUser, getUserProfile, signOut, Profile } from "@/lib/auth";
import { ProfileCard } from "@/components/profile/profile-card";
import { QRCode } from "@/components/profile/qr-code";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyCardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

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
        router.push("/complete-profile");
        return;
      }

      setUser(currentUser);
      setProfile(userProfile);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/u/${profile?.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name} - VibeLink`,
          text: `Check out my VibeLink profile!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Profile link copied to clipboard!");
    }
  };

  const handleDownloadQR = () => {
    setShowQR(true);
  };

  const handleEdit = () => {
    router.push("/edit-profile");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const publicProfileUrl = `${window.location.origin}/u/${profile.username}`;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
        <button
          onClick={handleSignOut}
          className="text-foreground/70 hover:text-foreground text-sm font-medium"
        >
          Sign Out
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
            <h1 className="text-2xl font-bold text-foreground mb-6">My Card</h1>

            {/* Profile Card */}
            <ProfileCard
              profile={profile}
              isOwner={true}
              onEdit={handleEdit}
              onShare={handleShare}
              onDownloadQR={handleDownloadQR}
            />

            {/* QR Code Modal */}
            {showQR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowQR(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-card rounded-3xl p-6 max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-foreground mb-2">Your QR Code</h2>
                    <p className="text-sm text-foreground/70">
                      Scan to view your public profile
                    </p>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    <QRCode value={publicProfileUrl} size={200} />
                  </div>

                  <p className="text-xs text-foreground/50 text-center mb-4">
                    {publicProfileUrl}
                  </p>

                  <button
                    onClick={() => setShowQR(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-2xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}