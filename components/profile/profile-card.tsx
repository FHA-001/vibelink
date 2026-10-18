"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ConnectedProfile, Profile } from "@/lib/auth";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileTags } from "./profile-tags";
import { SocialLinks } from "./social-links";
import { SafetyMenu } from "./safety-menu";
import { BlockDialog } from "./block-dialog";
import { UnblockDialog } from "./unblock-dialog";
import { ReportDialog } from "./report-dialog";
import { Calendar, MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ProfileCardProps {
  profile: ConnectedProfile; // Covers both ConnectedProfile and Profile (owner) since Profile extends ConnectedProfile
  isOwner?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onDownloadQR?: () => void;
}

export function ProfileCard({
  profile,
  isOwner = false,
  showActions = true,
  onEdit,
  onShare,
  onDownloadQR,
}: ProfileCardProps) {
  const router = useRouter();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check block state on mount and when profile changes
  useEffect(() => {
    const checkBlockState = async () => {
      if (isOwner) return;
      
      try {
        const { getCurrentUser, getMyBlockState } = await import('@/lib/auth');
        const currentUser = await getCurrentUser();
        
        if (currentUser && currentUser.id !== profile.id) {
          const blocked = await getMyBlockState(profile.id);
          setIsBlocked(blocked);
        }
      } catch (error) {
        console.error("Error checking block state:", error);
      }
    };

    checkBlockState();
  }, [profile.id, isOwner]);

  const handleBlock = async () => {
    try {
      const { createBlock } = await import('@/lib/auth');
      const result = await createBlock(profile.id);
      
      if (result.success) {
        toast({
          title: "User blocked",
          description: `@${profile.username} has been blocked.`,
        });
        setIsBlocked(true);
        router.refresh();
      } else {
        toast({
          title: "Failed to block user",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to block user",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleUnblock = async () => {
    try {
      const { removeBlock } = await import('@/lib/auth');
      const result = await removeBlock(profile.id);
      
      if (result.success) {
        toast({
          title: "User unblocked",
          description: `@${profile.username} has been unblocked.`,
        });
        setIsBlocked(false);
        router.refresh();
      } else {
        toast({
          title: "Failed to unblock user",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to unblock user",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleReport = async (reason: string, details?: string) => {
    try {
      const { createProfileReport } = await import('@/lib/auth');
      const result = await createProfileReport(profile.id, reason, details);
      
      if (result.success) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep VibeLink safe.",
        });
      } else {
        const errorMessage = result.error || "Please try again.";
        toast({
          title: "Unable to submit report",
          description: errorMessage.includes("rate limit") 
            ? "You've submitted several reports recently. Please try again later."
            : errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unable to submit report",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-3xl shadow-xl overflow-hidden"
    >
      {/* Profile Header */}
      <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 pt-8 pb-16 px-6">
        {!isOwner && (
          <div className="absolute top-4 right-4">
            <SafetyMenu
              isBlocked={isBlocked}
              onBlock={() => setBlockDialogOpen(true)}
              onUnblock={() => setUnblockDialogOpen(true)}
              onReport={() => setReportDialogOpen(true)}
            />
          </div>
        )}
        <div className="flex flex-col items-center">
          <ProfileAvatar
            src={profile.profile_photo || undefined}
            name={profile.full_name || profile.username}
            size="xl"
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground text-center">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-foreground/70 text-center">@{profile.username}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
          {/* Job Title & Company */}
          {profile.job_title && (
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {profile.job_title}
              </p>
              {profile.company_school && (
                <p className="text-foreground/70">{profile.company_school}</p>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-foreground/80 text-center leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Interests</h3>
              <ProfileTags tags={profile.interests} variant="primary" />
            </div>
          )}

          {/* Social Links */}
          <SocialLinks profile={profile} />

          {/* Joined Date */}
          {profile.created_at && (
            <div className="flex items-center justify-center gap-2 text-xs text-foreground/50">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && isOwner && (
          <div className="mt-4 space-y-3">
            <button
              onClick={onShare}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-2xl font-medium transition-colors"
            >
              Share Profile
            </button>
            <div className="flex gap-3">
              <button
                onClick={onDownloadQR}
                className="flex-1 border-2 border-border hover:border-primary/50 text-foreground py-3 rounded-2xl font-medium transition-colors"
              >
                Download QR
              </button>
              <button
                onClick={onEdit}
                className="flex-1 border-2 border-border hover:border-primary/50 text-foreground py-3 rounded-2xl font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        targetUsername={profile.username}
        onConfirm={handleBlock}
      />
      <UnblockDialog
        open={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        targetUsername={profile.username}
        onConfirm={handleUnblock}
      />
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetUsername={profile.username}
        onConfirm={handleReport}
      />
    </motion.div>
  );
}