"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Share2, Download, Edit, QrCode, UserPlus, Check, X } from "lucide-react";
import { getCurrentUser, getUserProfile, signOut, Profile, getPendingRequests, updateConnectionRequestStatus, ConnectionRequestWithProfile } from "@/lib/auth";
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
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequestWithProfile[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
    }
  }, [user]);

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

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await updateConnectionRequestStatus(requestId, 'accepted');
      if (result.success) {
        // Reload pending requests
        loadPendingRequests();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const result = await updateConnectionRequestStatus(requestId, 'declined');
      if (result.success) {
        // Reload pending requests
        loadPendingRequests();
      }
    } catch (error) {
      console.error("Error declining request:", error);
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

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="bg-card rounded-2xl shadow-lg p-4 border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Pending Requests ({pendingRequests.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            @{request.sender_profile?.username}
                          </p>
                          {request.sender_profile?.bio && (
                            <p className="text-xs text-foreground/70 truncate">
                              {request.sender_profile.bio}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg transition-colors"
                            aria-label="Accept request"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-colors"
                            aria-label="Decline request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

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