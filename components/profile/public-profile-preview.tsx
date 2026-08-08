"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Profile } from "@/lib/auth";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileTags } from "./profile-tags";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";

interface PublicProfilePreviewProps {
  profile: Profile;
  isOwner: boolean;
  onRequestSent?: () => void;
  onRequestError?: (error: string) => void;
}

export function PublicProfilePreview({
  profile,
  isOwner,
  onRequestSent,
  onRequestError,
}: PublicProfilePreviewProps) {
  const [isSending, setIsSending] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleKnowMore = async () => {
    setIsSending(true);
    setRequestStatus('idle');
    setErrorMessage('');

    try {
      const { getCurrentUser, createConnectionRequest, getConnectionRequestStatus } = await import('@/lib/auth');
      
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        // Redirect to sign in with return URL
        window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-3xl shadow-xl overflow-hidden"
    >
      {/* Profile Header */}
      <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 pt-8 pb-16 px-6">
        <div className="flex flex-col items-center">
          <ProfileAvatar
            src={profile.profile_photo}
            name={profile.full_name}
            size="xl"
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground text-center">
            @{profile.username}
          </h1>
          <p className="text-foreground/70 text-center">{profile.job_title}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
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

          {/* Company/School */}
          {profile.company_school && (
            <div className="text-center">
              <p className="text-foreground/70">{profile.company_school}</p>
            </div>
          )}

          {/* Know More Button */}
          {!isOwner && (
            <div className="pt-4">
              {requestStatus === 'sent' ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl font-medium transition-colors"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Know More"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
