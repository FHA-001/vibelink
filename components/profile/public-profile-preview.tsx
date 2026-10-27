"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Profile, PublicProfile, ConnectedProfile } from "@/lib/auth";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileTags } from "./profile-tags";
import { SocialLinks } from "./social-links";
import { SafetyMenu } from "./safety-menu";
import { BlockDialog } from "./block-dialog";
import { UnblockDialog } from "./unblock-dialog";
import { ReportDialog } from "./report-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PublicProfilePreviewProps {
  profile: Profile | ConnectedProfile | PublicProfile;
  isOwner: boolean;
  connectionStatus?: 'connected' | 'pending_sent' | 'pending_received' | 'declined' | 'none';
  onRequestSent?: () => void;
  onRequestError?: (error: string) => void;
}

export function PublicProfilePreview({
  profile,
  isOwner,
  connectionStatus = 'none',
  onRequestSent,
  onRequestError,
}: PublicProfilePreviewProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
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

  const handleKnowMore = async () => {
    setIsSending(true);
    setRequestStatus('idle');
    setErrorMessage('');

    try {
      const { getCurrentUser, createConnectionRequest, getConnectionRequestStatus } = await import('@/lib/auth');
      
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        // Redirect to sign in with return URL using Next.js router
        router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (currentUser.id === profile.id) {
        onRequestError?.("You cannot send a connection request to yourself");
        setRequestStatus('error');
        setErrorMessage("You cannot send a connection request to yourself");
        setIsSending(false);
        return;
      }

      // Check if request already exists
      const existingRequest = await getConnectionRequestStatus(currentUser.id, profile.id);
      if (existingRequest && existingRequest.status === 'pending') {
        onRequestError?.("You already have a pending request to this user");
        setRequestStatus('error');
        setErrorMessage("You already have a pending request to this user");
        setIsSending(false);
        return;
      }

      // Create connection request
      const result = await createConnectionRequest(currentUser.id, profile.id);
      
      if (result.success) {
        setRequestStatus('sent');
        onRequestSent?.();
      } else {
        setRequestStatus('error');
        setErrorMessage(result.error || "Failed to send request");
        onRequestError?.(result.error || "Failed to send request");
      }
    } catch (error) {
      setRequestStatus('error');
      setErrorMessage("An unexpected error occurred");
      onRequestError?.("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

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
            className="mb-4 ring-4 ring-background"
          />
          <h1 className="text-2xl font-semibold text-foreground text-center">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-muted-foreground text-center text-sm">@{profile.username}</p>
          {profile.job_title && (
            <p className="text-muted-foreground text-center text-sm mt-1">{profile.job_title}</p>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-foreground text-center leading-relaxed text-sm">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Company/School */}
          {profile.company_school && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">{profile.company_school}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Interests</h3>
              <ProfileTags tags={profile.interests} variant="primary" />
            </div>
          )}

          {/* Social Links */}
          <SocialLinks profile={profile} />

          {/* Know More Button */}
          {!isOwner && (
            <div className="pt-2 border-t border-border">
              {connectionStatus === 'pending_sent' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="bg-amber-500/10 border-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Request pending - waiting for response
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : connectionStatus === 'pending_received' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      They sent you a connection request - check your Connections tab
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : connectionStatus === 'declined' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connection request was declined
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : requestStatus === 'sent' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Connection request sent! They'll be notified.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : requestStatus === 'error' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <Button
                  onClick={handleKnowMore}
                  disabled={isSending}
                  size="lg"
                  className="w-full bg-primary hover:bg-[#D4B13F] text-primary-foreground py-4 rounded-xl font-semibold transition-all hover:shadow-lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
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
