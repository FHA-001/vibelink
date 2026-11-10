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
import { QRCode } from "./qr-code";
import { Calendar, Link as LinkIcon, Share2, QrCode as QrIcon, Edit as Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: ConnectedProfile; // Covers both ConnectedProfile and Profile (owner) since Profile extends ConnectedProfile
  isOwner?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onDownloadQR?: () => void;
  showQR?: boolean;
  qrUrl?: string;
  // Tighter layout that fits one phone screen, for screenshots
  compact?: boolean;
}

export function ProfileCard({
  profile,
  isOwner = false,
  showActions = true,
  onEdit,
  onShare,
  onDownloadQR,
  showQR = false,
  qrUrl,
  compact = false,
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

  const interests = profile.interests ?? [];
  const shownInterests = compact ? interests.slice(0, 4) : interests;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
    >
      {/* Profile Header */}
      <div className={cn("card-surface relative px-6", compact ? "pb-10 pt-6" : "pb-16 pt-10")}>
        <div className="gold-rule absolute inset-x-8 top-0" aria-hidden="true" />
        {!isOwner && (
          <div className="absolute right-3 top-3">
            <SafetyMenu
              onDark
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
            size={compact ? "lg" : "xl"}
            className={cn("ring-4 ring-white/20", compact ? "mb-2" : "mb-4")}
          />
          <h1
            className={cn(
              "text-center font-heading font-semibold text-ivory",
              compact ? "text-xl" : "text-2xl sm:text-3xl"
            )}
          >
            {profile.full_name || profile.username}
          </h1>
          <p className={cn("text-center text-ivory/75", compact ? "mt-0.5 text-sm" : "mt-1")}>
            @{profile.username}
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className={cn("px-4 sm:px-6", compact ? "pb-4" : "pb-6")}>
        <div
          className={cn(
            "rounded-2xl border border-border bg-card shadow-lg",
            compact ? "-mt-6 space-y-3 p-4" : "-mt-8 space-y-6 p-6 sm:p-8"
          )}
        >
          {/* Job Title & Company */}
          {profile.job_title && (
            <div className="text-center">
              <p
                className={cn(
                  "font-heading font-semibold text-navy",
                  compact ? "text-base" : "text-lg"
                )}
              >
                {profile.job_title}
              </p>
              {profile.company_school && (
                <p className={cn("text-muted-foreground", compact ? "mt-0.5 text-sm" : "mt-1")}>
                  {profile.company_school}
                </p>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p
              className={cn(
                "text-center text-foreground",
                compact ? "line-clamp-2 text-sm leading-snug" : "leading-relaxed"
              )}
            >
              {profile.bio}
            </p>
          )}

          {/* Interests */}
          {shownInterests.length > 0 && (
            <div>
              <h2 className={cn("font-semibold text-navy", compact ? "mb-2 text-xs" : "mb-3 text-sm")}>
                Interests
              </h2>
              <ProfileTags tags={shownInterests} variant="primary" />
            </div>
          )}

          {/* Social Links */}
          <SocialLinks profile={profile} compact={compact} />

          {/* QR Code and Connect Panel */}
          <div
            className={cn(
              "border-t border-border",
              compact
                ? "flex flex-row items-center justify-between gap-4 pt-3"
                : "flex flex-col items-center justify-between gap-5 pt-6 sm:flex-row sm:items-start sm:gap-6"
            )}
          >
            {/* QR Code */}
            {showQR && qrUrl && (
              <div className="shrink-0">
                <QRCode value={qrUrl} size={compact ? 96 : 128} className="!p-2 !shadow-sm" />
                <p className={cn("text-center text-xs text-muted-foreground", compact ? "mt-1" : "mt-2")}>
                  Scan to connect
                </p>
              </div>
            )}

            {/* Connect Panel */}
            <div className={cn(compact ? "min-w-0 flex-1" : "shrink-0 text-center sm:text-left")}>
              <div className={cn("card-surface rounded-2xl shadow-md", compact ? "p-3" : "p-4 sm:p-5")}>
                <h2 className="mb-1 font-heading text-base font-semibold text-ivory">Let&apos;s connect</h2>
                <p className={cn("text-xs text-ivory/75", compact ? "mb-2" : "mb-3")}>
                  Your next connection starts here.
                </p>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    compact ? "justify-start" : "justify-center sm:justify-start"
                  )}
                >
                  <LinkIcon className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-xs font-semibold text-primary">VibeLink</span>
                </div>
              </div>
              {/* Joined Date */}
              {profile.created_at && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    compact ? "mt-2 justify-start" : "mt-3 justify-center sm:justify-start"
                  )}
                >
                  <Calendar className="size-4 shrink-0" aria-hidden="true" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && isOwner && (
          <div className="mt-6 space-y-3">
            <Button size="lg" onClick={onShare} className="w-full">
              <Share2 aria-hidden="true" />
              Share profile
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" variant="outline" onClick={onDownloadQR}>
                <QrIcon aria-hidden="true" />
                Show QR
              </Button>
              <Button size="lg" variant="outline" onClick={onEdit}>
                <Pencil aria-hidden="true" />
                Edit profile
              </Button>
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
    </motion.article>
  );
}