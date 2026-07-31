"use client";

import { motion } from "framer-motion";
import { Profile } from "@/lib/auth";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileTags } from "./profile-tags";
import { SocialLinks } from "./social-links";
import { Calendar, MapPin } from "lucide-react";

interface ProfileCardProps {
  profile: Profile;
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
            {profile.full_name}
          </h1>
          <p className="text-foreground/70 text-center">@{profile.username}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
          {/* Job Title & Company */}
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {profile.job_title}
            </p>
            {profile.company_school && (
              <p className="text-foreground/70">{profile.company_school}</p>
            )}
          </div>

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
          <div className="flex items-center justify-center gap-2 text-xs text-foreground/50">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
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
    </motion.div>
  );
}